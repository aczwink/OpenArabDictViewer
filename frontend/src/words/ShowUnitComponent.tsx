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
import { Component, I18n, JSX_CreateElement } from "@aczwink/acfrontend";
import { LexemeAPIData, LexicalUnitAPIData } from "../services/CachedAPIService";
import { WordMayHaveGender, WordTypeToText } from "../shared/words";
import { OpenArabDictGender, OpenArabDictLexeme, OpenArabDictPOSType } from "@aczwink/openarabdict-domain";
import { ShowVerbComponent } from "../verbs/ShowVerbComponent";
import { Letter } from "@aczwink/openarabicconjugation";
import { Tashkil } from "@aczwink/openarabicconjugation/dist/Definitions";
import { WordLogic } from "@aczwink/openarabdict-openarabicconjugation-bridge";
import { RenderTranslations } from "../shared/translations";
import { AdjectiveOrNounDeclensionTable } from "./AdjectiveOrNounDeclensionTable";

export class ShowUnitComponent extends Component<{ lexeme: LexemeAPIData; unit: LexicalUnitAPIData }>
{
    protected Render(): RenderValue
    {
        if(this.input.unit.pos.type === OpenArabDictPOSType.Verb)
            return <ShowVerbComponent verbId={this.input.lexeme.id} />;

        return <table>
            <tbody>
                {this.RenderGenderLine()}
                <tr>
                    <th>{I18n("search.wordType")}:</th>
                    <td>{WordTypeToText(this.input.unit.pos.type)}</td>
                </tr>
                <tr>
                    <th>{I18n("word.translation")}:</th>
                    <td>{RenderTranslations(this.input.unit.translations)}</td>
                </tr>
                {this.RenderWordDeclensionTables()}
            </tbody>
        </table>
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

    private RenderWordDeclensionTables()
    {
        const pos = this.input.unit.pos;
        switch(pos.type)
        {
            case OpenArabDictPOSType.Adjective:
            case OpenArabDictPOSType.Noun:
                return <tr>
                    <th>{I18n("word.declension")}:</th>
                    <td><AdjectiveOrNounDeclensionTable word={this.input.lexeme} pos={pos} derivedWordIds={this.input.lexeme.derivedLexemeIds} /></td>
                </tr>;
        }
        return null;
    }
}