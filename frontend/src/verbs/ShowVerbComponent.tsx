/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2025 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

import { Anchor, Component, Injectable, JSX_CreateElement, ProgressSpinner } from "acfrontend";
import { WordRelation } from "../../dist/api";
import { StemNumberComponent } from "../shared/RomanNumberComponent";
import { RemoveTashkil } from "openarabicconjugation/src/Util";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { RenderTranslations } from "../shared/translations";
import { WordRelationshipTypeToString } from "../shared/words";
import { RootToString } from "../roots/general";
import { Person, Numerus, Gender, Mood, Voice, AdvancedStemNumber, VerbType } from "openarabicconjugation/src/Definitions";
import { DisplayVocalized } from "openarabicconjugation/src/Vocalization";
import { Tense } from "openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { ConjugationSchemeToString } from "./ToStringStuff";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { OpenArabDictRoot, OpenArabDictVerb, OpenArabDictWordType } from "openarabdict-domain";
import { WordIdReferenceComponent } from "../words/WordReferenceComponent";
import { CachedAPIService, WordWithConnections } from "../services/CachedAPIService";
import { WordTableComponent } from "../words/WordTableComponent";

@Injectable
export class ShowVerbComponent extends Component<{ verbId: string }>
{
    constructor(private conjugationService: ConjugationService, private dialectsService: DialectsService,
        private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService
    )
    {
        super();

        this.data = null;
        this.fullWord = null;
        this.root = { radicals: "", id: "" };
        this.derivedWords = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.data === null)
            return <ProgressSpinner />;

        const stem1ctx = this.data.stemParameters;
        const verb = this.verbConjugationService.ConstructVerb(this.rootRadicals, this.data);

        return <fragment>
            {this.verbConjugationService.RenderCheck(this.rootRadicals, this.data)}
            <div className="row">
                <h2>{this.data.text}</h2>
            </div>

            {this.RenderProperties(stem1ctx)}
            <br />
            <a href={"https://en.wiktionary.org/wiki/" + RemoveTashkil(this.data.text)} target="_blank">See on Wiktionary</a>
            <br />
            {this.RenderDerivedWords()}
            {this.RenderConjugation(verb.type, stem1ctx)}
        </fragment>;
    }

    //Private state
    private data: OpenArabDictVerb | null;
    private fullWord: WordWithConnections | null;
    private root: OpenArabDictRoot;
    private derivedWords: WordWithConnections[] | null;

    //Private properties
    private get rootRadicals()
    {
        return this.root.radicals;
    }

    //Private methods
    private async LoadDerivedWords()
    {
        this.derivedWords = await this.fullWord!.derived.Values().Map(x => this.cachedAPIService.QueryWordWithConnections(x)).PromiseAll();
    }

    private RenderConjugation(verbType: VerbType, stem1ctx?: string)
    {
        const dialectType = this.dialectsService.MapIdToType(this.data!.dialectId);
        const dialectMetaData = this.dialectsService.GetDialectMetaData(this.data!.dialectId);
        const past = this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Perfect, Voice.Active, Gender.Male, Person.Third, Numerus.Singular, Mood.Indicative, verbType, stem1ctx);

        const passive = dialectMetaData.hasPassive ? [
            <h5>Passive voice الْفِعْل الْمَجْهُول</h5>,
            this.RenderConjugationTable("Past الْمَاضِي", verbType, stem1ctx, Tense.Perfect, Voice.Passive, Mood.Indicative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Perfect, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1ctx)),
            this.RenderConjugationTable("Present indicative الْمُضَارِع الْمَرْفُوع", verbType, stem1ctx, Tense.Present, Voice.Passive, Mood.Indicative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1ctx)),
            this.RenderConjugationTable("Subjunctive الْمُضَارِع الْمَنْصُوب", verbType, stem1ctx, Tense.Present, Voice.Passive, Mood.Subjunctive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Passive, g, p, n, Mood.Indicative, verbType, stem1ctx)),
            this.RenderConjugationTable("Jussive الْمُضَارِع الْمَجْزُوم", verbType, stem1ctx, Tense.Present, Voice.Passive, Mood.Jussive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Passive, g, p, n, Mood.Subjunctive, verbType, stem1ctx)),
        ] : null;

        const jussive = dialectMetaData.hasJussive ?
            this.RenderConjugationTable("Jussive الْمُضَارِع الْمَجْزُوم ", verbType, stem1ctx, Tense.Present, Voice.Active, Mood.Jussive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Active, g, p, n, Mood.Subjunctive, verbType, stem1ctx))
            : null;

        return <div className="mt-2">
            <h4>Conjugation</h4>
            <h5>Active voice الْفِعْل الْمَعْلُوم</h5>
            {this.RenderConjugationTable("Past الْمَاضِي", verbType, stem1ctx, Tense.Perfect, Voice.Active, Mood.Indicative, () => past)}
            {this.RenderConjugationTable("Present indicative الْمُضَارِع الْمَرْفُوع", verbType, stem1ctx, Tense.Present, Voice.Active, Mood.Indicative, () => past)}
            {this.RenderConjugationTable("Subjunctive الْمُضَارِع الْمَنْصُوب", verbType, stem1ctx, Tense.Present, Voice.Active, Mood.Subjunctive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1ctx))}
            {jussive}
            {this.RenderConjugationTableImperative("Imperative الْأَمْر", verbType, stem1ctx, Tense.Present, Voice.Active, Mood.Imperative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Present, Voice.Active, g, p, n, Mood.Jussive, verbType, stem1ctx))}

            {passive}
        </div>;
    }

    private RenderConjugationTable(tenseTitle: string, verbType: VerbType, stem1ctx: string | undefined, tempus: Tense, voice: Voice, mood: Mood, base: (g: Gender, p: Person, n: Numerus) => DisplayVocalized[])
    {
        const dialectType = this.dialectsService.MapIdToType(this.data!.dialectId);
        const dialectMetaData = this.dialectsService.GetDialectMetaData(this.data!.dialectId);

        const conjugate = (g: Gender, p: Person, n: Numerus) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, tempus, voice, g, p, n, mood, verbType, stem1ctx);
        const renderEntry = (g: Gender, p: Person, n: Numerus) => RenderWithDiffHighlights(conjugate(g, p, n), base(g, p, n));

        const dual = dialectMetaData.hasDual ? [
            <tr>
                <th rowSpan="2">dual الْمُثَنَّى</th>
                <th>Male</th>
                <td rowSpan="2"> </td>
                <td rowSpan="2">{renderEntry(Gender.Male, Person.Second, Numerus.Dual)}</td>
                <td>{renderEntry(Gender.Male, Person.Third, Numerus.Dual)}</td>
            </tr>
        ,
            <tr>
                <th>Female</th>
                <td>{renderEntry(Gender.Female, Person.Third, Numerus.Dual)}</td>
            </tr>
        ] : null;

        const plural = dialectMetaData.hasFemalePlural ? [
            <tr>
                <th rowSpan="2">plural الْجَمْع</th>
                <th>Male</th>
                <td rowSpan="2">{renderEntry(Gender.Male, Person.First, Numerus.Plural)}</td>
                <td>{renderEntry(Gender.Male, Person.Second, Numerus.Plural)}</td>
                <td>{renderEntry(Gender.Male, Person.Third, Numerus.Plural)}</td>
            </tr>
        ,
            <tr>
                <th>Female</th>
                <td>{renderEntry(Gender.Female, Person.Second, Numerus.Plural)}</td>
                <td>{renderEntry(Gender.Female, Person.Third, Numerus.Plural)}</td>
            </tr>
        ] : [
            <tr>
                <th colSpan="2" rowSpan="1">plural الْجَمْع</th>
                <td>{renderEntry(Gender.Male, Person.First, Numerus.Plural)}</td>
                <td rowSpan="1">{renderEntry(Gender.Male, Person.Second, Numerus.Plural)}</td>
                <td rowSpan="1">{renderEntry(Gender.Male, Person.Third, Numerus.Plural)}</td>
            </tr>
        ];

        return <fragment>
            <h6>{tenseTitle}</h6>
            <table className="table table-bordered table-sm">
            <thead>
                <tr>
                    <th colSpan="2"> </th>
                    <th>1st person الْمُتَكَلِّم</th>
                    <th>2nd person الْمُخَاطَب</th>
                    <th>3rd person الْغَائِب</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th rowSpan="2">singular الْمُفْرَد</th>
                    <th>Male</th>
                    <td rowSpan="2">{renderEntry(Gender.Male, Person.First, Numerus.Singular)}</td>
                    <td>{renderEntry(Gender.Male, Person.Second, Numerus.Singular)}</td>
                    <td>{renderEntry(Gender.Male, Person.Third, Numerus.Singular)}</td>
                </tr>
                <tr>
                    <th>Female</th>
                    <td>{renderEntry(Gender.Female, Person.Second, Numerus.Singular)}</td>
                    <td>{renderEntry(Gender.Female, Person.Third, Numerus.Singular)}</td>
                </tr>
                {dual}
                {plural}
            </tbody>
        </table>
        </fragment>;
    }

    private RenderConjugationTableImperative(tenseTitle: string, verbType: VerbType, stem1ctx: string | undefined, tempus: Tense, voice: Voice, mood: Mood, base: (g: Gender, p: Person, n: Numerus) => DisplayVocalized[])
    {
        const dialectType = this.dialectsService.MapIdToType(this.data!.dialectId);
        const dialectMetaData = this.dialectsService.GetDialectMetaData(this.data!.dialectId);

        const conjugate = (g: Gender, p: Person, n: Numerus) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, tempus, voice, g, p, n, mood, verbType, stem1ctx);
        const renderEntry = (g: Gender, p: Person, n: Numerus) => RenderWithDiffHighlights(conjugate(g, p, n), base(g, p, n));

        const dual = dialectMetaData.hasDual ? [
            <tr>
                <th colSpan="2">dual الْمُثَنَّى</th>
                <td>{renderEntry(Gender.Male, Person.Second, Numerus.Dual)}</td>
            </tr>
        ] : null;

        const plural = dialectMetaData.hasFemalePlural ? [
            <tr>
                <th rowSpan="2">plural الْجَمْع</th>
                <th>Male</th>
                <td>{renderEntry(Gender.Male, Person.Second, Numerus.Plural)}</td>
            </tr>
        ,
            <tr>
                <th>Female</th>
                <td>{renderEntry(Gender.Female, Person.Second, Numerus.Plural)}</td>
            </tr>
        ] : [
            <tr>
                <th colSpan="2">plural الْجَمْع</th>
                <td>{renderEntry(Gender.Male, Person.Second, Numerus.Plural)}</td>
            </tr>
        ];

        return <fragment>
            <h6>{tenseTitle}</h6>
            <table className="table table-bordered table-sm">
            <thead>
                <tr>
                    <th colSpan="2"> </th>
                    <th>2nd person الْمُخَاطَب</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th rowSpan="2">singular الْمُفْرَد</th>
                    <th>Male</th>
                    <td>{renderEntry(Gender.Male, Person.Second, Numerus.Singular)}</td>
                </tr>
                <tr>
                    <th>Female</th>
                    <td>{renderEntry(Gender.Female, Person.Second, Numerus.Singular)}</td>
                </tr>
                {dual}
                {plural}
            </tbody>
        </table>
        </fragment>;
    }

    private RenderDerivedWords()
    {
        if(this.derivedWords === null)
            return <ProgressSpinner />;

        return <div className="mt-2">
            <h5>Derived words</h5>
            <WordTableComponent collapse={false} words={this.derivedWords} />
        </div>;
    }

    private RenderProperties(stem1ctx?: string)
    {
        const data = this.data!;
        const dialect = this.dialectsService.GetDialect(data.dialectId);
        const dialectType = this.dialectsService.MapIdToType(data.dialectId);
        const verb = this.verbConjugationService.ConstructVerb(this.rootRadicals, data);
        const past = this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, this.data!.stem, Tense.Perfect, Voice.Active, Gender.Male, Person.Third, Numerus.Singular, Mood.Indicative, verb.type, stem1ctx);

        const stemData = (stem1ctx === undefined) ? (this.data!.stem! as AdvancedStemNumber) : stem1ctx;
        const verbalNounRow = this.conjugationService.HasPotentiallyMultipleVerbalNounForms(this.rootRadicals, stemData) ? null : <tr>
            <th>Verbal noun الْمَصْدَر</th>
            <td>{this.conjugationService.GenerateAllPossibleVerbalNouns(this.rootRadicals, stemData)[0]}</td>
        </tr>;

        const type = this.verbConjugationService.GetType(this.rootRadicals, this.data!);
        return <table>
            <tbody>
                <tr>
                    <th>Root:</th>
                    <td><Anchor route={"/roots/" + data.rootId}>{RootToString(this.root)}</Anchor></td>
                </tr>
                <tr>
                    <th>Dialect:</th>
                    <td>{dialect.emojiCodes} {dialect.name}</td>
                </tr>
                <tr>
                    <th>Form:</th>
                    <td>
                        <StemNumberComponent verbType={type} stem={data.stem} />
                        {" "}
                        {ConjugationSchemeToString(type)}
                        {" "}
                        {this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(this.rootRadicals, data)}
                    </td>
                </tr>
                <tr>
                    <th>Active participle اِسْم الْفَاعِل:</th>
                    <td>{RenderWithDiffHighlights(this.conjugationService.ConjugateParticiple(verb, Voice.Active), past)}</td>
                </tr>
                <tr>
                    <th>Passive participle اِسْم الْمَفْعُول:</th>
                    <td>{RenderWithDiffHighlights(this.conjugationService.ConjugateParticiple(verb, Voice.Passive), past)}</td>
                </tr>
                {verbalNounRow}
                <tr>
                    <th>Related:</th>
                    <td>{this.RenderRelations(this.fullWord!.related)}</td>
                </tr>
                <tr>
                    <th>Translation:</th>
                    <td>{RenderTranslations(data.translations)}</td>
                </tr>
            </tbody>
        </table>;
    }

    private RenderRelation(related: WordRelation)
    {
        return <li>
            {WordRelationshipTypeToString(related.relationType)} of <WordIdReferenceComponent wordId={related.relatedWordId} />
        </li>;
    }

    private RenderRelations(related: WordRelation[])
    {
        return <ul>
            {related.map(this.RenderRelation.bind(this))}
        </ul>;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const full = await this.cachedAPIService.QueryWordWithConnections(this.input.verbId);
        if(full.word.type !== OpenArabDictWordType.Verb)
            throw new Error("TODO implement me");

        const root = await this.cachedAPIService.QueryRootData(full.word.rootId);

        this.fullWord = full;
        this.root = root;
        this.data = full.word;

        this.LoadDerivedWords();
    }
}