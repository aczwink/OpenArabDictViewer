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

import { JSX_CreateElement, I18n } from "@aczwink/acfrontend";
import { OpenArabDictPOSType } from "@aczwink/openarabdict-domain";
import { AdjectiveOrNounDeclensionTable } from "./AdjectiveOrNounDeclensionTable";
import { ShowVerbConjugationTablesComponent } from "./ShowVerbConjugationTablesComponent";
import { LexemeData, LexicalUnit } from "../../dist/api";

export function ShowDeclensionTablesComponent(input: { lexeme: LexemeData; unit: LexicalUnit; })
{
    switch(input.unit.pos.type)
    {
        case OpenArabDictPOSType.Adjective:
        case OpenArabDictPOSType.Noun:
            return <div className="mt-2">
                <h5>{I18n("word.declension")}</h5>
                <AdjectiveOrNounDeclensionTable word={input.lexeme} pos={input.unit.pos} derivedWordIds={input.unit.derivedLexemeIds} />
            </div>;
        case OpenArabDictPOSType.Verb:
            return <ShowVerbConjugationTablesComponent verbId={input.lexeme.id} />;
    }
    return null;
}