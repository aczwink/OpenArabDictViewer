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
import { JSX_CreateElement } from "acfrontend";
import { Letter, Tashkil } from "openarabicconjugation/src/Definitions";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { _Legacy_ExtractMiddleRadicalTashkil, _Legacy_ExtractPresentMiddleRadicalTashkil, ModernStandardArabicStem1ParametersType } from "openarabicconjugation/src/dialects/msa/conjugation/r2tashkil";
import { Verb } from "openarabicconjugation/dist/Verb";
import { VerbRoot, RootType } from "openarabicconjugation/dist/VerbRoot";

const need = 2;

function IsSpecial(root: VerbRoot, verb: Verb<ModernStandardArabicStem1ParametersType>)
{
    //doubly weak ones
    if( (root.r1 === Letter.Hamza) && (root.r3 === Letter.Ya) && (verb.stem === 4) )
        return need;
    if( (root.r1 === Letter.Waw) && ((root.r3 === Letter.Waw) || (root.r3 === Letter.Ya)) && (verb.stem === 8) )
        return need;

    switch(verb.stem)
    {
        case 1:
            switch(root.type)
            {
                case RootType.HamzaOnR1:
                {
                    if((_Legacy_ExtractMiddleRadicalTashkil(verb.stemParameterization) === Tashkil.Dhamma) && (_Legacy_ExtractPresentMiddleRadicalTashkil(verb.stemParameterization) === Tashkil.Dhamma))
                        return need;
                }
                break;
            }
            break;
        case 6:
            switch(root.type)
            {
                case RootType.SecondConsonantDoubled:
                    return need;
            }
            break;
        case 7:
            switch(root.type)
            {
                case RootType.SecondConsonantDoubled:
                    return need;
            }
            break;
    }
}

export function _TODO_CheckConjugation(dialectType: DialectType, root: VerbRoot, verb: Verb<string>)
{
    if(dialectType !== DialectType.ModernStandardArabic)
        return null;

    const special = IsSpecial(root, verb as any);
    switch(special)
    {
        case undefined:
            break;
        case need:
            return <h1 className="text-bg-danger p-3">CHECK WIKTIONARY AND WRITE TEST!</h1>;
    }

    return null;
}