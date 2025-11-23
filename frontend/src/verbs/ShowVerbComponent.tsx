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
import { VerbVariant, WordRelation } from "../../dist/api";
import { StemNumberComponent } from "../shared/RomanNumberComponent";
import { RemoveTashkil } from "openarabicconjugation/src/Util";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { RenderTranslations } from "../shared/translations";
import { WordRelationshipTypeToString } from "../shared/words";
import { RootToString } from "../roots/general";
import { Person, Numerus, Gender, Mood, Voice } from "openarabicconjugation/src/Definitions";
import { DisplayVocalized } from "openarabicconjugation/src/Vocalization";
import { Tense } from "openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { ConjugationSchemeToString } from "./ToStringStuff";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { OpenArabDictRoot, OpenArabDictVerb, OpenArabDictVerbForm, OpenArabDictWordType } from "openarabdict-domain";
import { WordIdReferenceComponent } from "../words/WordReferenceComponent";
import { CachedAPIService, WordWithConnections } from "../services/CachedAPIService";
import { WordTableComponent } from "../words/WordTableComponent";
import { Verb } from "openarabicconjugation/dist/Verb";
import { DialectType } from "openarabicconjugation/dist/Dialects";
import { GlobalSettingsService } from "../services/GlobalSettingsService";

@Injectable
export class ShowVerbComponent extends Component<{ verbId: string }>
{
    constructor(private conjugationService: ConjugationService, private dialectsService: DialectsService, private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService,
        private globalSettingsService: GlobalSettingsService,
    )
    {
        super();

        this.data = null;
        this.fullWord = null;
        this.root = { radicals: "", id: "" };
        this.derivedWords = null;
        this.activeStemParameters = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.data === null)
            return <ProgressSpinner />;

        const dialectType = this.verbConjugationService.SelectDialect(this.rootRadicals, this.data.form);
        if(dialectType === null)
            return "This verb can not be conjugated in any dialect unfortunately...";

        const verb = this.verbConjugationService.ConstructVerb(dialectType, this.rootRadicals, this.GetForm(dialectType));

        return <fragment>
            {this.verbConjugationService.RenderCheck(dialectType, this.rootRadicals, this.data)}
            <div className="row">
                <h2>{this.data.text}</h2>
            </div>

            {this.RenderProperties(verb)}
            <br />
            <a href={"https://en.wiktionary.org/wiki/" + RemoveTashkil(this.data.text)} target="_blank">See on Wiktionary</a>
            <br />
            {this.RenderDerivedWords()}
            {this.RenderConjugation(verb)}
        </fragment>;
    }

    //Private state
    private data: OpenArabDictVerb | null;
    private fullWord: WordWithConnections | null;
    private root: OpenArabDictRoot;
    private derivedWords: WordWithConnections[] | null;
    private activeStemParameters: string | null;

    //Private properties
    private get rootRadicals()
    {
        return this.root.radicals;
    }

    //Private methods
    private GetForm(dialectType: DialectType): OpenArabDictVerbForm
    {
        const variants = this.GetMultipleVariants(dialectType);
        if(variants !== undefined)
        {
            const variant = variants.find(x => this.activeStemParameters === x.stemParameters)!;
            return {
                ...this.data!.form,
                variants: [variant]
            };
        }
        return this.data!.form;
    }

    private GetMultipleVariants(dialectType: DialectType)
    {
        const dialectId = this.dialectsService.FindDialect(dialectType)!.id;
        const variants = this.data?.form.variants?.filter(x => x.dialectId === dialectId);

        if((variants !== undefined) && (variants.length > 1))
            return variants;
        return undefined;
    }

    private async LoadDerivedWords()
    {
        this.derivedWords = await this.fullWord!.derived.Values().Map(x => this.cachedAPIService.QueryWordWithConnections(x)).PromiseAll();
    }

    private RenderConjugation(verb: Verb<string>)
    {
        const verbType = verb.type;
        const dialectType = verb.dialect;
        const stem = verb.stem;
        const stem1Context = (verb.stem === 1) ? verb.stemParameterization : undefined;

        const dialect = this.dialectsService.FindDialect(dialectType)!;
        const dialectMetaData = this.dialectsService.GetDialectMetaData(dialect.id);

        const past = this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Perfect, Voice.Active, Gender.Male, Person.Third, Numerus.Singular, Mood.Indicative, verbType, stem1Context);

        const passive = dialectMetaData.hasPassive ? [
            <h5>Passive voice الْفِعْل الْمَجْهُول</h5>,
            this.RenderConjugationTable("Past الْمَاضِي", verb, Tense.Perfect, Voice.Passive, Mood.Indicative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Perfect, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1Context)),
            this.RenderConjugationTable("Present indicative الْمُضَارِع الْمَرْفُوع", verb, Tense.Present, Voice.Passive, Mood.Indicative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1Context)),
            this.RenderConjugationTable("Subjunctive الْمُضَارِع الْمَنْصُوب", verb, Tense.Present, Voice.Passive, Mood.Subjunctive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Passive, g, p, n, Mood.Indicative, verbType, stem1Context)),
            this.RenderConjugationTable("Jussive الْمُضَارِع الْمَجْزُوم", verb, Tense.Present, Voice.Passive, Mood.Jussive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Passive, g, p, n, Mood.Subjunctive, verbType, stem1Context)),
        ] : null;

        const jussive = dialectMetaData.hasJussive ?
            this.RenderConjugationTable("Jussive الْمُضَارِع الْمَجْزُوم ", verb, Tense.Present, Voice.Active, Mood.Jussive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Active, g, p, n, Mood.Subjunctive, verbType, stem1Context))
            : null;

        return <div className="mt-2">
            <h4>Conjugation</h4>
            <h5>Active voice الْفِعْل الْمَعْلُوم</h5>
            {this.RenderConjugationTable("Past الْمَاضِي", verb, Tense.Perfect, Voice.Active, Mood.Indicative, () => past)}
            {this.RenderConjugationTable("Present indicative الْمُضَارِع الْمَرْفُوع", verb, Tense.Present, Voice.Active, Mood.Indicative, () => past)}
            {this.RenderConjugationTable("Subjunctive الْمُضَارِع الْمَنْصُوب", verb, Tense.Present, Voice.Active, Mood.Subjunctive, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Active, g, p, n, Mood.Indicative, verbType, stem1Context))}
            {jussive}
            {this.RenderConjugationTableImperative("Imperative الْأَمْر", verb, Tense.Present, Voice.Active, Mood.Imperative, (g, p, n) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, stem, Tense.Present, Voice.Active, g, p, n, Mood.Jussive, verbType, stem1Context))}

            {passive}
        </div>;
    }

    private RenderConjugationTable(tenseTitle: string, verb: Verb<string>, tempus: Tense, voice: Voice, mood: Mood, base: (g: Gender, p: Person, n: Numerus) => DisplayVocalized[])
    {
        const dialectType = verb.dialect;

        const dialect = this.dialectsService.FindDialect(dialectType)!;
        const dialectMetaData = this.dialectsService.GetDialectMetaData(dialect.id);

        const conjugate = (g: Gender, p: Person, n: Numerus) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, verb.stem, tempus, voice, g, p, n, mood, verb.type, (verb.stem === 1) ? verb.stemParameterization : undefined);
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

    private RenderConjugationTableImperative(tenseTitle: string, verb: Verb<string>, tempus: Tense, voice: Voice, mood: Mood, base: (g: Gender, p: Person, n: Numerus) => DisplayVocalized[])
    {
        const dialectType = verb.dialect;

        const dialect = this.dialectsService.FindDialect(dialectType)!;
        const dialectMetaData = this.dialectsService.GetDialectMetaData(dialect.id);

        const conjugate = (g: Gender, p: Person, n: Numerus) => this.conjugationService.ConjugateArgs(dialectType, this.rootRadicals, verb.stem, tempus, voice, g, p, n, mood, verb.type, (verb.stem === 1) ? verb.stemParameterization : undefined);
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

    private RenderDialectHint(dialectType: DialectType)
    {
        if(dialectType !== this.globalSettingsService.dialectType)
        {
            return <span className="badge rounded-pill text-bg-danger">This verb can not be conjugated in your favorite dialect.</span>;
        }
        return null;
    }

    private RenderProperties(verb: Verb<string>)
    {
        const data = this.data!;
        const dialect = this.dialectsService.FindDialect(verb.dialect)!;
        const past = this.conjugationService.ConjugateArgs(verb.dialect, this.rootRadicals, verb.stem, Tense.Perfect, Voice.Active, Gender.Male, Person.Third, Numerus.Singular, Mood.Indicative, verb.type, (verb.stem === 1) ? verb.stemParameterization : undefined);

        const verbalNounRow = (verb.dialect !== DialectType.ModernStandardArabic) || (this.conjugationService.HasPotentiallyMultipleVerbalNounForms(verb)) ? null : <tr>
            <th>Verbal noun الْمَصْدَر</th>
            <td>{this.conjugationService.GenerateAllPossibleVerbalNouns(verb)[0]}</td>
        </tr>;

        const type = verb.type;
        const passiveParticiple = (this.dialectsService.GetDialectMetaData(dialect.id).hasPassive) ? <tr>
            <th>Passive participle اِسْم الْمَفْعُول:</th>
            <td>{RenderWithDiffHighlights(this.conjugationService.ConjugatePassiveParticiple(verb), past)}</td>
        </tr> : null;
        return <table>
            <tbody>
                <tr>
                    <th>Root:</th>
                    <td><Anchor route={"/roots/" + data.rootId}>{RootToString(this.root)}</Anchor></td>
                </tr>
                <tr>
                    <th>Dialect:</th>
                    <td>{dialect.emojiCodes} {dialect.name} {this.RenderDialectHint(verb.dialect)}</td>
                </tr>
                <tr>
                    <th>Form:</th>
                    <td>
                        <StemNumberComponent verbType={type} stem={verb.stem} />
                        {" "}
                        {ConjugationSchemeToString(type)}
                        {" "}
                        {this.RenderVariantSelection(verb)}
                    </td>
                </tr>
                <tr>
                    <th>Active participle اِسْم الْفَاعِل:</th>
                    <td>{RenderWithDiffHighlights(this.conjugationService.ConjugateActiveParticiple(verb, data.form.stativeActiveParticiple === true), past)}</td>
                </tr>
                {passiveParticiple}
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

    private RenderVariantSelection(verb: Verb<string>)
    {
        const variants = this.GetMultipleVariants(verb.dialect);
        if(variants !== undefined)
        {
            return <span className="flex-shrink-0 py-2">
                <a href="#" className="text-decoration-none dropdown-toggle" data-bs-toggle="dropdown">
                    {this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(verb.dialect, this.rootRadicals, this.GetForm(verb.dialect))}
                </a>
                <ul className="dropdown-menu shadow">
                    {variants.map(this.RenderVariantSelectionChoice.bind(this, verb))}
                </ul>
            </span>;
        }
        return this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(verb.dialect, this.rootRadicals, this.data!.form);
    }

    private RenderVariantSelectionChoice(verb: Verb<string>, variant: VerbVariant)
    {
        const className = (this.activeStemParameters === variant.stemParameters) ? "dropdown-item active" : "dropdown-item";
        return <li>
            <a className={className} href="#" onclick={this.OnChangeVariant.bind(this, variant)}>{this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(verb.dialect, this.rootRadicals, {
                ...this.data!.form,
                variants: [variant]
            })}</a>
        </li>;
    }

    //Event handlers
    private OnChangeVariant(variant: VerbVariant, event: Event)
    {
        event.preventDefault();
        this.activeStemParameters = variant.stemParameters;
    }

    override async OnInitiated(): Promise<void>
    {
        const full = await this.cachedAPIService.QueryWordWithConnections(this.input.verbId);
        if(full.word.type !== OpenArabDictWordType.Verb)
            throw new Error("TODO implement me");

        const root = await this.cachedAPIService.QueryRootData(full.word.rootId);

        this.fullWord = full;
        this.root = root;
        this.data = full.word;

        if(this.data.form.variants !== undefined)
            this.activeStemParameters = this.data.form.variants[0].stemParameters;

        this.LoadDerivedWords();
    }
}