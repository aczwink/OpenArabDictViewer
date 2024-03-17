/**
 * ArabDict
 * Copyright (C) 2023-2024 Amir Czwink (amir130@hotmail.de)
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
import { Letter, Tashkil } from "../../../Definitions";
import { RootType, VerbRoot } from "../../../VerbRoot";
import { FullyVocalized } from "../../../Vocalization";

export function GenerateAllPossibleVerbalNounsStem6(root: VerbRoot): FullyVocalized[]
{
    switch(root.type)
    {
        case RootType.Assimilated:
        case RootType.Sound:
            return [
                { letter: Letter.Ta, shadda: false, tashkil: Tashkil.Fatha },
                { letter: root.r1, shadda: false, tashkil: Tashkil.Fatha },
                { letter: Letter.Alef, shadda: false, tashkil: Tashkil.Fatha },
                { letter: root.r2, shadda: false, tashkil: Tashkil.Dhamma },
                { letter: root.r3, shadda: false, tashkil: Tashkil.Sukun },
            ];
    }

    return [{letter: "TODO" as any, shadda: false, tashkil: Tashkil.Fatha}];
}