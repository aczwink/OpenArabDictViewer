/**
 * OpenArabDictViewer
 * Copyright (C) 2023-2026 Amir Czwink (amir130@hotmail.de)
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

import { Component, Injectable, JSX_CreateElement, ProgressSpinner } from "@aczwink/acfrontend";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { Person, Numerus, Gender, Mood, Voice } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DisplayVocalized } from "@aczwink/openarabicconjugation/dist/Vocalization";
import { Tense } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { OpenArabDictPOSType, OpenArabDictRoot, OpenArabDictVerb, OpenArabDictVerbForm } from "@aczwink/openarabdict-domain";
import { CachedAPIService } from "../services/CachedAPIService";
import { Verb } from "@aczwink/openarabicconjugation/dist/Verb";
import { DialectType } from "@aczwink/openarabicconjugation/dist/Dialects";
import { Dialects } from "@aczwink/openarabicconjugation";

@Injectable
export class ShowVerbConjugationTablesComponent extends Component<{ verbId: string }>
{
    constructor(private conjugationService: ConjugationService, private dialectsService: DialectsService, private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService
    )
    {
        super();

        this.data = null;
        this.root = { radicals: "", id: "" };
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

        return this.RenderConjugation(verb);
    }

    //Private state
    private data: OpenArabDictVerb | null;
    private root: OpenArabDictRoot;
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

    private HasPassive(verb: Verb<string>)
    {
        if(!this.data?.form.hasPassive)
            return false;

        const dialectMetaData = Dialects.GetDialectMetadata(verb.dialect);
        return dialectMetaData.hasPassive;
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

        const passive = this.HasPassive(verb) ? [
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

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const full = await this.cachedAPIService.QueryLexeme(this.input.verbId);
        const pos = full?.senses[0].units[0].pos;
        if((full === undefined) || pos?.type !== OpenArabDictPOSType.Verb)
            throw new Error("Programming error!");

        const root = await this.cachedAPIService.QueryRootData(pos.rootId);

        this.root = root;
        this.data = pos;

        if(this.data.form.variants !== undefined)
            this.activeStemParameters = this.data.form.variants[0].stemParameters ?? null;
    }
}