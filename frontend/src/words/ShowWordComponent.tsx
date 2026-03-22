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
import { WordIdReferenceComponent } from "./WordReferenceComponent";
import { AdjectiveOrNounDeclensionTable } from "./AdjectiveOrNounDeclensionTable";
import { RenderDerivedTerm, WordDerivationComponent } from "./WordDerivationComponent";
import { CachedAPIService, WordWithConnections } from "../services/CachedAPIService";
import { OpenArabDictGender, OpenArabDictParentType, OpenArabDictWord, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { ShowVerbComponent } from "../verbs/ShowVerbComponent";
import { Letter } from "@aczwink/openarabicconjugation";
import { Tashkil } from "@aczwink/openarabicconjugation/dist/Definitions";

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

        if(this.data.word.type === OpenArabDictWordType.Verb)
            return <ShowVerbComponent verbId={this.data.word.id} />;

        return <fragment>
            <div className="row">
                <h1>{I18n("word.word")}: {this.data.word.text}</h1>
            </div>
            <table>
                <tbody>
                    {this.RenderGenderLine()}
                    {this.RenderDerivationData()}
                    {this.RenderRelated(this.data.related)}
                    {this.RenderDerivedTerms()}
                    <tr>
                        <th>{I18n("search.wordType")}:</th>
                        <td>{WordTypeToText(this.data.word.type)}</td>
                    </tr>
                    <tr>
                        <th>{I18n("word.translation")}:</th>
                        <td>{RenderTranslations(this.data.translations)}</td>
                    </tr>
                    {this.RenderWordDeclensionTables()}
                </tbody>
            </table>
            <a href={"https://en.wiktionary.org/wiki/" + RemoveTashkil(this.data.word.text)} target="_blank">{I18n("word.seeOnWiktionary")}</a>
        </fragment>;
    }

    //Private methods
    private IsExpectedGender(gender: OpenArabDictGender)
    {
        const hasSoundFemaleEnding = this.IsSingular() ? this.data!.word.text.endsWith(Letter.TaMarbuta) : this.data!.word.text.endsWith(Tashkil.Fatha + Letter.Alef + Letter.Ta);

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

    /*private IsSingular()
    {
        return WordLogic.IsSingular(this.input.word);
    }*/
   private IsSingular() //TODO: USE WordLogic.IsSingular
    {
        return this.data?.word.parent.find(x => x.type === OpenArabDictParentType.Plural) === undefined;
    }

    private RenderDerivationData()
    {
        return <tr>
            <th>{I18n("word.derivedFrom")}:</th>
            <td><WordDerivationComponent parent={this.data!.word.parent} /></td>
        </tr>;
    }

    private RenderDerivedTerm(derived: OpenArabDictWord)
    {
        const link = derived.parent.find(x => (x.type !== OpenArabDictParentType.Root) && (x.id === this.data!.word.id))!;
        return RenderDerivedTerm(false, { id: derived.id, type: link.type });
    }
    
    private RenderDerivedTerms()
    {
        if(this.data!.derived.length === 0)
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
        if(!WordMayHaveGender(this.data!.word))
            return null;

        const genderText = this.RenderGender(this.data!.word.gender);
        const gender = this.IsExpectedGender(this.data!.word.gender) ? genderText : <span className="text-danger fw-bold">{genderText}</span>;

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
            {WordRelationshipTypeToString(related.relationType as any)} of <WordIdReferenceComponent wordId={related.relatedWordId} />
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
        switch(this.data!.word.type)
        {
            case OpenArabDictWordType.Adjective:
            case OpenArabDictWordType.Noun:
                return <tr>
                    <th>{I18n("word.declension")}:</th>
                    <td><AdjectiveOrNounDeclensionTable word={this.data!.word} derivedWordIds={this.data!.derived} /></td>
                </tr>;
        }
        return null;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        const word = await this.cachedAPIService.QueryWordWithConnections(this.wordId);
        if(word === undefined)
        {
            this.notFound = true;
            return;
        }

        this.derived = await word.derived.Values().Map(x => this.cachedAPIService.QueryWord(x)).PromiseAll();

        this.data = word;
        this.titleService.title = this.data.word.text;
    }

    //Private state
    private wordId: string;
    private notFound: boolean;
    private data: WordWithConnections | null;
    private derived: OpenArabDictWord[];
}