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

import { Component, I18n, Injectable, JSX_CreateElement, ProgressSpinner, RouterState, TitleService } from "@aczwink/acfrontend";
import { WordRelation } from "../../dist/api";
import { RenderTranslations } from "../shared/translations";
import { WordMayHaveGender, WordRelationshipTypeToString, WordTypeToText } from "../shared/words";
import { RemoveTashkil } from "@aczwink/openarabicconjugation/dist/Util";
import { LexemeIdReferenceComponent } from "./WordReferenceComponent";
import { AdjectiveOrNounDeclensionTable } from "./AdjectiveOrNounDeclensionTable";
import { RenderDerivedTerm, WordDerivationComponent } from "./WordDerivationComponent";
import { CachedAPIService, LexemeAPIData } from "../services/CachedAPIService";
import { OpenArabDictGender, OpenArabDictLexeme, OpenArabDictParentType, OpenArabDictPOSType } from "@aczwink/openarabdict-domain";
import { ShowVerbComponent } from "../verbs/ShowVerbComponent";
import { Letter } from "@aczwink/openarabicconjugation";
import { Tashkil } from "@aczwink/openarabicconjugation/dist/Definitions";
import { WordLogic } from "@aczwink/openarabdict-openarabicconjugation-bridge";

@Injectable
export class ShowWordComponent extends Component
{
    constructor(routerState: RouterState, private titleService: TitleService, private cachedAPIService: CachedAPIService)
    {
        super();

        this.wordId = routerState.routeParams.wordId!;
        this.notFound = false;
        this.data = null;
        this.derived = [];
    }

    protected Render(): RenderValue
    {
        if(this.notFound)
            return I18n("word.notFound");
        if(this.data === null)
            return <ProgressSpinner />;

        if(this.data.senses[0].units[0].pos.type === OpenArabDictPOSType.Verb)
            return <ShowVerbComponent verbId={this.data.id} />;

        return <fragment>
            <div className="row">
                <h1>{I18n("word.word")}: {this.data.text}</h1>
            </div>
            <table>
                <tbody>
                    {this.RenderGenderLine()}
                    {this.RenderDerivationData()}
                    {this.RenderRelated(this.data.related)}
                    {this.RenderDerivedTerms()}
                    <tr>
                        <th>{I18n("search.wordType")}:</th>
                        <td>{WordTypeToText(this.data.senses[0].units[0].pos.type)}</td>
                    </tr>
                    <tr>
                        <th>{I18n("word.translation")}:</th>
                        <td>{RenderTranslations(this.data.senses[0].units[0].translations)}</td>
                    </tr>
                    {this.RenderWordDeclensionTables()}
                </tbody>
            </table>
            <a href={"https://en.wiktionary.org/wiki/" + RemoveTashkil(this.data.text)} target="_blank">{I18n("word.seeOnWiktionary")}</a>
        </fragment>;
    }

    //Private methods
    private IsExpectedGender(gender: OpenArabDictGender)
    {
        const hasSoundFemaleEnding = this.IsSingular() ? this.data!.text.endsWith(Letter.TaMarbuta) : this.data!.text.endsWith(Tashkil.Fatha + Letter.Alef + Letter.Ta);

        switch(gender)
        {
            case OpenArabDictGender.Female:
                return hasSoundFemaleEnding;
            case OpenArabDictGender.FemaleOrMale:
                return true;
            case OpenArabDictGender.Male:
                return !hasSoundFemaleEnding;
        }
    }
    
    private IsSingular()
    {
        return WordLogic.IsSingular(this.data! as unknown as OpenArabDictLexeme);
    }

    private RenderDerivationData()
    {
        return <tr>
            <th>{I18n("word.derivedFrom")}:</th>
            <td><WordDerivationComponent parent={this.data!.parent} /></td>
        </tr>;
    }

    private RenderDerivedTerm(derived: LexemeAPIData)
    {
        const link = derived.parent.find(x => (x.type !== OpenArabDictParentType.Root) && (x.id === this.data!.id))!;
        return RenderDerivedTerm(false, { id: derived.id, type: link.type });
    }
    
    private RenderDerivedTerms()
    {
        if(this.data!.derivedLexemeIds.length === 0)
            return null;

        return <tr>
            <th>Derived words/terms:</th>
            <td>
                <ul>{this.derived.map(x => <li>{this.RenderDerivedTerm(x)}</li>)}</ul>
            </td>
        </tr>;
    }

    private RenderGender(isMale: OpenArabDictGender | null)
    {
        switch(isMale)
        {
            case OpenArabDictGender.Female:
                return I18n("word.genders.female");
            case OpenArabDictGender.FemaleOrMale:
                return "female or male";
            case OpenArabDictGender.Male:
                return I18n("word.genders.male");
        }
        return "unknown";
    }

    private RenderGenderLine()
    {
        const pos = this.data!.senses[0].units[0].pos;
        if(!WordMayHaveGender(pos))
            return null;

        const genderText = this.RenderGender(pos.gender);
        const gender = this.IsExpectedGender(pos.gender) ? genderText : <span className="text-danger fw-bold">{genderText}</span>;

        return <tr>
            <th>{I18n("word.gender")}:</th>
            <td>{gender}</td>
        </tr>;
    }

    private RenderRelated(related: WordRelation[])
    {
        if(related.length === 0)
            return null;

        return <tr>
            <th>Related:</th>
            <td>{this.RenderRelations(related)}</td>
        </tr>;
    }

    private RenderRelation(related: WordRelation)
    {
        return <li>
            {WordRelationshipTypeToString(related.relationType as any)} of <LexemeIdReferenceComponent lexemeId={related.relatedWordId} />
        </li>;
    }

    private RenderRelations(related: WordRelation[])
    {
        return <ul>
            {related.map(this.RenderRelation.bind(this))}
        </ul>;
    }

    private RenderWordDeclensionTables()
    {
        const pos = this.data!.senses[0].units[0].pos;
        switch(pos.type)
        {
            case OpenArabDictPOSType.Adjective:
            case OpenArabDictPOSType.Noun:
                return <tr>
                    <th>{I18n("word.declension")}:</th>
                    <td><AdjectiveOrNounDeclensionTable word={this.data!} pos={pos} derivedWordIds={this.data!.derivedLexemeIds} /></td>
                </tr>;
        }
        return null;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const word = await this.cachedAPIService.QueryLexeme(this.wordId);
        if(word === undefined)
        {
            this.notFound = true;
            return;
        }

        this.derived = await word.derivedLexemeIds.Values().Map(x => this.cachedAPIService.QueryLexeme(x)).Async().NotUndefined().ToArray();

        this.data = word;
        this.titleService.title = this.data.text;
    }

    //Private state
    private wordId: string;
    private notFound: boolean;
    private data: LexemeAPIData | null;
    private derived: LexemeAPIData[];
}