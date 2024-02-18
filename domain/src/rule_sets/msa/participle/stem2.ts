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

import { MIM, DHAMMA, FATHA, KASRA } from "../../../Definitions";
import { RootType, VerbRoot } from "../../../VerbRoot";
import { PartiallyVocalized } from "../../../Vocalization";
import { Voice } from "../_legacy/VerbStem";

export function GenerateParticipleStem2(root: VerbRoot, voice: Voice): PartiallyVocalized[]
{
    switch(root.type)
    {
        case RootType.Hollow:
        case RootType.SecondConsonantDoubled:
        case RootType.Sound:
            return [
                { letter: MIM, shadda: false, tashkil: DHAMMA },
                { letter: root.r1, shadda: false, tashkil: FATHA },
                { letter: root.r2, shadda: true, tashkil: (voice === "active") ? KASRA : FATHA },
                { letter: root.r3, shadda: false },
            ];
    }
    return [{letter: "TODO", shadda: false}];
}