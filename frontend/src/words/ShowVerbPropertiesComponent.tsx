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

import { Anchor, Component, Injectable, JSX_CreateElement, ProgressSpinner } from "@aczwink/acfrontend";
import { LexemeData, VerbVariant, WordRelation } from "../../dist/api";
import { StemNumberComponent } from "../shared/RomanNumberComponent";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { RenderTranslations } from "../shared/translations";
import { WordRelationshipTypeToString } from "../shared/words";
import { Person, Numerus, Gender, Mood, Voice } from "@aczwink/openarabicconjugation/dist/Definitions";
import { Tense } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { OpenArabDictParentType, OpenArabDictPOSType, OpenArabDictRoot, OpenArabDictVerb, OpenArabDictVerbForm } from "@aczwink/openarabdict-domain";
import { LexemeIdReferenceComponent } from "./WordReferenceComponent";
import { CachedAPIService } from "../services/CachedAPIService";
import { Verb } from "@aczwink/openarabicconjugation/dist/Verb";
import { DialectType } from "@aczwink/openarabicconjugation/dist/Dialects";
import { GlobalSettingsService } from "../services/GlobalSettingsService";
import ENV from "../env";
import { Dialects } from "@aczwink/openarabicconjugation";
import { ConjugationSchemeToString } from "../verbs/ToStringStuff";

@Injectable
export class ShowVerbPropertiesComponent extends Component<{ verbId: string }>
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

        return this.RenderProperties(verb);
    }

    //Private state
    private data: OpenArabDictVerb | null;
    private fullWord: LexemeData | null;
    private root: OpenArabDictRoot;
    private derivedWords: LexemeData[] | null;
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

    private async LoadDerivedWords()
    {
        this.derivedWords = await this.fullWord!.senses[0].units[0].derivedLexemeIds.Values().Map(x => this.cachedAPIService.QueryLexeme(x)).Async().NotUndefined().ToArray();
    }

    private RenderDialectHint(dialect: DialectType)
    {
        if(dialect !== this.globalSettingsService.dialectType)
            return <span className="badge rounded-pill text-bg-danger">This verb can not be conjugated in your favorite dialect.</span>;
        if(!this.verbConjugationService.IsNativeConjugationPossible(this.globalSettingsService.dialectType, this.fullWord!))
            return <span className="badge rounded-pill text-bg-warning">This verb is not native to your favorite dialect.</span>;
        return null;
    }

    private RenderProperties(verb: Verb<string>)
    {
        const data = this.data!;
        const dialect = this.dialectsService.FindDialect(verb.dialect)!;
        const past = this.conjugationService.ConjugateArgs(verb.dialect, this.rootRadicals, verb.stem, Tense.Perfect, Voice.Active, Gender.Male, Person.Third, Numerus.Singular, Mood.Indicative, verb.type, (verb.stem === 1) ? verb.stemParameterization : undefined);

        const type = verb.type;
        const passiveParticiple = this.HasPassive(verb) ? <tr>
            <th>Passive participle اِسْم الْمَفْعُول:</th>
            <td>{RenderWithDiffHighlights(this.conjugationService.ConjugatePassiveParticiple(verb), past)}</td>
        </tr> : null;
        return <table>
            <tbody>
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
                    <td>{RenderWithDiffHighlights(this.conjugationService.ConjugateActiveParticiple(verb, data.form.stative === true), past)}</td>
                </tr>
                {passiveParticiple}
                {this.RenderVerbalNouns(verb)}
                {this.RenderVerbalNounPatterns(verb)}
                <tr>
                    <th>Related:</th>
                    <td>{this.RenderRelations(this.fullWord!.related)}</td>
                </tr>
                <tr>
                    <th>Translation:</th>
                    <td>{RenderTranslations(this.fullWord!.senses[0].units[0].translations)}</td>
                </tr>
            </tbody>
        </table>;
    }

    private RenderRelation(related: WordRelation)
    {
        return <li>
            {WordRelationshipTypeToString(related.relationType)} of <LexemeIdReferenceComponent lexemeId={related.relatedWordId} />
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

    private RenderVerbalNouns(verb: Verb<string>)
    {
        if(verb.dialect !== DialectType.ModernStandardArabic)
            return null;

        const verbalNouns = this.derivedWords?.filter(x => (x.parent.find(y => y.type === OpenArabDictParentType.VerbalNoun) !== undefined)) ?? [];
        let verbalNounRendering;
        if(verbalNouns.length > 0)
            verbalNounRendering = verbalNouns.map(x => <Anchor route={"/words/" + x.id}>{x.text}</Anchor>);
        else
        {
            const patterns = this.conjugationService.GenerateAllPossibleVerbalNouns(verb);
            if(patterns.length === 1)
                verbalNounRendering = patterns;
            else
                verbalNounRendering = null;
        }

        if(verbalNounRendering === null)
            return null;
        
        return <tr>
            <th>Verbal noun الْمَصْدَر:</th>
            <td>{verbalNounRendering.Interleave(", ")}</td>
        </tr>;
    }

    private RenderVerbalNounPatterns(verb: Verb<string>)
    {
        if((!ENV.isDebugModeSwitchedOn) || (verb.dialect !== DialectType.ModernStandardArabic))
            return null;

        const patterns = this.conjugationService.GenerateAllPossibleVerbalNouns(verb);
        return <tr>
            <th>DEBUG: Verbal noun patterns:</th>
            <td>{patterns.join(", ")}</td>
        </tr>;
    }

    //Event handlers
    private OnChangeVariant(variant: VerbVariant, event: Event)
    {
        event.preventDefault();
        this.activeStemParameters = variant.stemParameters ?? null;
    }

    override async OnInitiated(): Promise<void>
    {
        const full = await this.cachedAPIService.QueryLexeme(this.input.verbId);
        const pos = full?.senses[0].units[0].pos;
        if((full === undefined) || pos?.type !== OpenArabDictPOSType.Verb)
            throw new Error("Programming error!");

        const root = await this.cachedAPIService.QueryRootData(pos.rootId);

        this.fullWord = full;
        this.root = root;
        this.data = pos;

        if(this.data.form.variants !== undefined)
            this.activeStemParameters = this.data.form.variants[0].stemParameters ?? null;

        this.LoadDerivedWords();
    }
}