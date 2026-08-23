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
import { LexemeData, LexicalUnit, VerbVariant, WordRelation } from "../../dist/api";
import { StemNumberComponent } from "../shared/RomanNumberComponent";
import { RenderWithDiffHighlights } from "../shared/RenderWithDiffHighlights";
import { ConjugationService } from "../services/ConjugationService";
import { RenderTranslations } from "../shared/translations";
import { WordRelationshipTypeToString } from "../shared/words";
import { Person, Numerus, Gender, Mood, Voice } from "@aczwink/openarabicconjugation/dist/Definitions";
import { Tense } from "@aczwink/openarabicconjugation/dist/Definitions";
import { DialectsService } from "../services/DialectsService";
import { VerbConjugationService } from "../services/VerbConjugationService";
import { OpenArabDictParentType, OpenArabDictRoot, OpenArabDictVerb, OpenArabDictVerbForm } from "@aczwink/openarabdict-domain";
import { LexemeIdReferenceComponent } from "./WordReferenceComponent";
import { CachedAPIService } from "../services/CachedAPIService";
import { Verb } from "@aczwink/openarabicconjugation/dist/Verb";
import { DialectType } from "@aczwink/openarabicconjugation/dist/Dialects";
import { GlobalSettingsService } from "../services/GlobalSettingsService";
import ENV from "../env";
import { Dialects } from "@aczwink/openarabicconjugation";
import { ConjugationSchemeToString } from "../verbs/ToStringStuff";

@Injectable
export class ShowVerbPropertiesComponent extends Component<{ lexeme: LexemeData; verb: OpenArabDictVerb; unit: LexicalUnit }>
{
    constructor(private conjugationService: ConjugationService, private dialectsService: DialectsService, private verbConjugationService: VerbConjugationService, private cachedAPIService: CachedAPIService,
        private globalSettingsService: GlobalSettingsService,
    )
    {
        super();

        this.root = { radicals: "", id: "" };
        this.derivedWords = null;
    }
    
    protected Render(): RenderValue
    {
        if(this.derivedWords === null)
            return <ProgressSpinner />;

        const dialectType = this.verbConjugationService.SelectDialect(this.rootRadicals, this.input.verb.form);
        if(dialectType === null)
            return "This verb can not be conjugated in any dialect unfortunately...";

        const verb = this.verbConjugationService.ConstructVerb(dialectType, this.rootRadicals, this.input.verb.form);

        return this.RenderProperties(verb);
    }

    //Private state
    private root: OpenArabDictRoot;
    private derivedWords: LexemeData[] | null;

    //Private properties
    private get rootRadicals()
    {
        return this.root.radicals;
    }

    //Private methods
    private GetMultipleVariants(dialectType: DialectType)
    {
        const dialectId = this.dialectsService.FindDialect(dialectType)!.id;
        const variants = this.input.verb.form.variants?.filter(x => x.dialectId === dialectId);

        if((variants !== undefined) && (variants.length > 1))
            return variants;
        return undefined;
    }

    private HasPassive(verb: Verb<string>)
    {
        if(!this.input.verb.form.hasPassive)
            return false;

        const dialectMetaData = Dialects.GetDialectMetadata(verb.dialect);
        return dialectMetaData.hasPassive;
    }

    private async LoadDerivedWords()
    {
        this.derivedWords = await this.input.unit.derivedLexemeIds.Values().Map(x => this.cachedAPIService.QueryLexeme(x)).Async().NotUndefined().ToArray();
    }

    private RenderDialectHint(dialect: DialectType)
    {
        if(dialect !== this.globalSettingsService.dialectType)
            return <span className="badge rounded-pill text-bg-danger">This verb can not be conjugated in your favorite dialect.</span>;
        if(!this.verbConjugationService.IsNativeConjugationPossible(this.globalSettingsService.dialectType, this.input.lexeme))
            return <span className="badge rounded-pill text-bg-warning">This verb is not native to your favorite dialect.</span>;
        return null;
    }

    private RenderProperties(verb: Verb<string>)
    {
        const data = this.input.verb;
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
                        {this.RenderVariants(verb)}
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
                    <td>{this.RenderRelations(this.input.lexeme.related)}</td>
                </tr>
                <tr>
                    <th>Translation:</th>
                    <td>{RenderTranslations(this.input.unit.translations)}</td>
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

    private RenderVariant(verb: Verb<string>, variant: VerbVariant)
    {
        return this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(verb.dialect, this.rootRadicals, {
            ...this.input.verb.form,
            variants: [variant]
        });
    }

    private RenderVariants(verb: Verb<string>)
    {
        const variants = this.GetMultipleVariants(verb.dialect);
        if(variants !== undefined)
            return variants.map(this.RenderVariant.bind(this, verb)).Interleave(" / ");
        return this.verbConjugationService.CreateDefaultDisplayVersionOfVerb(verb.dialect, this.rootRadicals, this.input.verb.form);
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
    override async OnInitiated(): Promise<void>
    {
        const root = await this.cachedAPIService.QueryRootData(this.input.verb.rootId);

        this.root = root;

        this.LoadDerivedWords();
    }
}