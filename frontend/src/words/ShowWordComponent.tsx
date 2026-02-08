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
import { OpenArabDictWord, OpenArabDictWordParentType, OpenArabDictWordType } from "@aczwink/openarabdict-domain";
import { ShowVerbComponent } from "../verbs/ShowVerbComponent";

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
                    <tr>
                        <th>{I18n("word.declension")}:</th>
                        <td>{this.RenderWordDeclensionTables()}</td>
                    </tr>
                </tbody>
            </table>
            <a href={"https://en.wiktionary.org/wiki/" + RemoveTashkil(this.data.word.text)} target="_blank">{I18n("word.seeOnWiktionary")}</a>
        </fragment>;
    }

    //Private methods
    private RenderDerivationData()
    {
        const derivation = this.data!.word.parent;
        if(derivation === undefined)
            return null;

        return <tr>
            <th>{I18n("word.derivedFrom")} {this.RenderDerivationSource()}:</th>
            <td><WordDerivationComponent parent={this.data?.word.parent} /></td>
        </tr>;
    }

    private RenderDerivationSource()
    {
        const parent = this.data!.word.parent;
        if(parent === undefined)
            return null;

        switch(parent.type)
        {
            case OpenArabDictWordParentType.NonVerbWord:
                return "word";
            case OpenArabDictWordParentType.Root:
                return "root";
            case OpenArabDictWordParentType.Verb:
                return "verb";
        }
    }


    private RenderDerivedTerms()
    {
        if(this.data!.derived.length === 0)
            return null;

        return <tr>
            <th>Derived words/terms:</th>
            <td>
                <ul>{this.derived.map(x => <li>{RenderDerivedTerm(false, { relationType: (x.parent as any).relationType, type: OpenArabDictWordParentType.NonVerbWord, wordId: x.id })}</li>)}</ul>
            </td>
        </tr>;
    }

    private RenderGender(isMale: boolean | null)
    {
        if(isMale)
            return I18n("word.genders.male");
        else if(isMale === false)
            return I18n("word.genders.female");
        return "unknown";
    }

    private RenderGenderLine()
    {
        if(!WordMayHaveGender(this.data!.word))
            return null;

        return <tr>
            <th>{I18n("word.gender")}:</th>
            <td>{this.RenderGender(this.data!.word.isMale)}</td>
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
                return <AdjectiveOrNounDeclensionTable word={this.data!.word} derivedWordIds={this.data!.derived} />;
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