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
import { Component, I18n, Injectable, JSX_CreateElement, JSX_Fragment } from "@aczwink/acfrontend";
import { CachedAPIService, LexemeAPIData, LexicalUnitAPIData } from "../services/CachedAPIService";
import { WordMayHaveGender, WordTypeToText } from "../shared/words";
import { OpenArabDictGender, OpenArabDictLexeme, OpenArabDictParentType, OpenArabDictPOSType } from "@aczwink/openarabdict-domain";
import { ShowVerbConjugationTablesComponent } from "./ShowVerbConjugationTablesComponent";
import { Letter } from "@aczwink/openarabicconjugation";
import { Tashkil } from "@aczwink/openarabicconjugation/dist/Definitions";
import { WordLogic } from "@aczwink/openarabdict-openarabicconjugation-bridge";
import { RenderTranslations } from "../shared/translations";
import { AdjectiveOrNounDeclensionTable } from "./AdjectiveOrNounDeclensionTable";
import { WordTableComponent } from "./WordTableComponent";
import { RenderDerivedTerm } from "./WordDerivationComponent";
import { ShowVerbPropertiesComponent } from "./ShowVerbPropertiesComponent";

@Injectable
export class ShowUnitComponent extends Component<{ lexeme: LexemeAPIData; unit: LexicalUnitAPIData }>
{
    constructor(private cachedAPIService: CachedAPIService)
    {
        super();

        this.derived = [];
    }

    protected Render(): RenderValue
    {
        return <>
            <table>
                <tbody>
                    {this.RenderProperties()}
                </tbody>
            </table>
            {this.RenderDerivedTerms()}
            {this.RenderWordDeclensionTables()}
        </>;
    }

    //Private methods
    private IsExpectedGender(gender: OpenArabDictGender)
    {
        const hasSoundFemaleEnding = this.IsSingular() ? this.input.lexeme.text.endsWith(Letter.TaMarbuta) : this.input.lexeme.text.endsWith(Tashkil.Fatha + Letter.Alef + Letter.Ta);

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
        return WordLogic.IsSingular(this.input.lexeme as unknown as OpenArabDictLexeme);
    }

    private RenderDerivedTerm(derived: LexemeAPIData)
    {
        const link = derived.parent.find(x => (x.type !== OpenArabDictParentType.Root) && (x.id === this.input.lexeme.id))!;
        return RenderDerivedTerm(false, { id: derived.id, type: link.type });
    }

    private RenderDerivedTerms()
    {
        const unit = this.input.unit;
        if(unit.derivedLexemeIds.length === 0)
            return null;

        if(unit.pos.type === OpenArabDictPOSType.Verb)
        {
            return <div className="mt-2">
                <h5>Derived terms</h5>
                <WordTableComponent collapse={false} words={this.derived} />
            </div>;
        }

        return <div className="mt-2">
            <h5>Derived terms</h5>
            <ul>{this.derived.map(x => <li>{this.RenderDerivedTerm(x)}</li>)}</ul>
        </div>;
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
        const pos = this.input.unit.pos;
        if(!WordMayHaveGender(pos))
            return null;

        const genderText = this.RenderGender(pos.gender);
        const gender = this.IsExpectedGender(pos.gender) ? genderText : <span className="text-danger fw-bold">{genderText}</span>;

        return <tr>
            <th>{I18n("word.gender")}:</th>
            <td>{gender}</td>
        </tr>;
    }

    private RenderProperties()
    {
        if(this.input.unit.pos.type === OpenArabDictPOSType.Verb)
            return <ShowVerbPropertiesComponent verbId={this.input.lexeme.id} />;

        return <>
            {this.RenderGenderLine()}
            <tr>
                <th>{I18n("search.wordType")}:</th>
                <td>{WordTypeToText(this.input.unit.pos.type)}</td>
            </tr>
            <tr>
                <th>{I18n("word.translation")}:</th>
                <td>{RenderTranslations(this.input.unit.translations)}</td>
            </tr>
        </>;
    }

    private RenderWordDeclensionTables()
    {
        const pos = this.input.unit.pos;
        switch(pos.type)
        {
            case OpenArabDictPOSType.Adjective:
            case OpenArabDictPOSType.Noun:
                return <div className="mt-2">
                    <h5>{I18n("word.declension")}</h5>
                    <AdjectiveOrNounDeclensionTable word={this.input.lexeme} pos={pos} derivedWordIds={this.input.unit.derivedLexemeIds} />
                </div>;
            case OpenArabDictPOSType.Verb:
                return <ShowVerbConjugationTablesComponent verbId={this.input.lexeme.id} />;
        }
        return null;
    }

    //Event handlers
    override async OnInitiated(): Promise<void>
    {
        this.derived = await this.input.unit.derivedLexemeIds.Values().Map(x => this.cachedAPIService.QueryLexeme(x)).Async().NotUndefined().ToArray();
    }

    //State
    private derived: LexemeAPIData[];
}