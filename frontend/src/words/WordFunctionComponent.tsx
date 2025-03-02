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

import { Component, Injectable, JSX_CreateElement } from "acfrontend";
import { RenderTranslations } from "../shared/translations";
import { WordDerivationComponent } from "./WordDerivationComponent";
import { OpenArabDictWord } from "openarabdict-domain";

@Injectable
export class WordFunctionComponent extends Component<{ word: OpenArabDictWord; }>
{
    protected Render(): RenderValue
    {
        const func = this.input.word;
        if(func.translations.length === 0)
            return <WordDerivationComponent parent={this.input.word.parent} />;
        return RenderTranslations(func.translations);
    }
}