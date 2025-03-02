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
import { ConjugationParams, Letter, Tashkil } from "openarabicconjugation/src/Definitions";
import { DialectType } from "openarabicconjugation/src/Dialects";
import { VerbRoot, RootType } from "openarabicconjugation/src/VerbRoot";

export function _TODO_CheckConjugation(dialectType: DialectType, root: VerbRoot, params: ConjugationParams)
{
    const needNothing = 0;
    const needPassive = 1;
    const need = 2;

    function IsSpecial()
    {
        //doubly weak ones
        if( (root.r1 === Letter.Hamza) && (root.r2 === root.r3) && (params.stem === 1) )
            return need;
        if( (root.r1 === Letter.Hamza) && (root.r3 === Letter.Ya) && (params.stem === 4) )
            return need;
        if( (root.r1 === Letter.Waw) && ((root.r3 === Letter.Waw) || (root.r3 === Letter.Ya)) && (params.stem === 4) )
            return need;
        if( (root.r1 === Letter.Waw) && ((root.r3 === Letter.Waw) || (root.r3 === Letter.Ya)) && (params.stem === 8) )
            return need;

        switch(params.stem)
        {
            case 1:
                switch(root.type)
                {
                    case RootType.InitialWeak:
                    {
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Kasra) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Fatha))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Fatha) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Dhamma))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Dhamma) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Dhamma))
                            return need;
                    }
                    break;
                    case RootType.HamzaOnR1:
                    {
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Fatha) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Dhamma))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Fatha) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Kasra))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Fatha) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Fatha))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Kasra) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Kasra))
                            return need;
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Dhamma) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Dhamma))
                            return need;
                    }
                    case RootType.MiddleWeak:
                    {
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Dhamma) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Fatha))
                            return need;
                    }
                    break;
                    case RootType.SecondConsonantDoubled:
                    {
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Fatha) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Fatha))
                            return need;
                    }
                    break;
                    case RootType.Regular:
                    {
                        if((params.stem1Context._legacy_middleRadicalTashkil === Tashkil.Dhamma) && (params.stem1Context._legacy_middleRadicalTashkilPresent === Tashkil.Dhamma))
                            return need;
                    }
                    break;
                }
                break;
            case 2:
                switch(root.type)
                {
                    case RootType.DoublyWeak_WawOnR1_WawOrYaOnR3:
                        return needPassive;
                    case RootType.Quadriliteral:
                        return need;
                }
                break;
            case 4:
                switch(root.type)
                {
                    case RootType.Quadriliteral:
                        return needPassive;
                }
                break;
            case 6:
                switch(root.type)
                {
                    case RootType.FinalWeak:
                        return needPassive;
                    case RootType.SecondConsonantDoubled:
                        return need;
                }
                break;
            case 7:
                switch(root.type)
                {
                    case RootType.FinalWeak:
                    case RootType.MiddleWeak:
                    case RootType.SecondConsonantDoubled:
                        return need;
                    case RootType.Regular:
                        return needPassive;
                }
                break;
            case 9:
                switch(root.type)
                {
                    case RootType.InitialWeak:
                    case RootType.FinalWeak:
                    case RootType.DoublyWeak_WawOnR1_WawOrYaOnR3:
                    case RootType.HamzaOnR1:
                    case RootType.MiddleWeak:
                    case RootType.Quadriliteral:
                    case RootType.SecondConsonantDoubled:
                        return need;
                    case RootType.Regular:
                        return needPassive;
                }
                break;
        }
        return needNothing;
    }

    if(dialectType !== DialectType.ModernStandardArabic)
        return null;

    const special = IsSpecial();
    switch(special)
    {
        case needNothing:
            break;
        case needPassive:
            return <h1 className="text-bg-danger p-3">CHECK WIKTIONARY IF PASSIVE EXISTS AND WRITE TEST!</h1>;
        case need:
            return <h1 className="text-bg-danger p-3">CHECK WIKTIONARY AND WRITE TEST!</h1>;
    }

    return null;
}