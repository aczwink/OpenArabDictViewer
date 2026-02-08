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

import { Component, JSX_CreateElement } from "@aczwink/acfrontend";
import { VerbType } from "@aczwink/openarabicconjugation/dist/Definitions";

export class RomanNumberComponent extends Component<{ num: number; }>
{
    protected Render(): RenderValue
    {
        const num = this.input.num;
        
        switch(num)
        {
            case 1:
                return "I";
            case 2:
                return "II";
            case 3:
                return "III";
            case 4:
                return "IV";
            case 5:
                return "V";
            case 6:
                return "VI";
            case 7:
                return "VII";
            case 8:
                return "VIII";
            case 9:
                return "IX";
            case 10:
                return "X";
        }
        throw new Error("not implemented for number: " + num);
    }
}

export class StemNumberComponent extends Component<{ verbType: VerbType; stem: number; }>
{
    protected Render(): RenderValue
    {
        const suffix = ((this.input.verbType === VerbType.SoundQuadriliteral) || (this.input.verbType === VerbType.QuadriliteralAndDefective)) ? "q" : "";
        return <fragment>
            <RomanNumberComponent num={this.input.stem} />{suffix}
        </fragment>;
    }
}