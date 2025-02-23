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

import { BootstrapIcon, JSX_CreateElement, RootInjector } from "acfrontend";
import { DialectsService } from "../services/DialectsService";
import { OpenArabDictTranslationEntry } from "../../dist/api";

function RenderText(text: string[])
{
    if(text.length === 0)
        return null;
    if(text.length === 1)
        return text[0];
    return <ul>
        {text.map(x => <li>{x}</li>)}
    </ul>;
}

function RenderSource(translationEntry: OpenArabDictTranslationEntry)
{
    const isComplete = translationEntry.complete === true;
    const className = isComplete ? "text-success" : "text-primary";
    const icon = <BootstrapIcon>{isComplete ? "journal-check" : "journal-text"}</BootstrapIcon>;

    if(translationEntry.url === undefined)
    {
        if(isComplete)
            return icon;
        return null;
    }

    return <a target="_blank" className={className} title="Show source" href={translationEntry.url}>
        {icon}
    </a>;
}

function RenderTranslationEntry(translationEntry: OpenArabDictTranslationEntry)
{
    const d = RootInjector.Resolve(DialectsService).GetDialect(translationEntry.dialectId);
    return <div className="row">
        <div className="col" style="white-space: pre-wrap;">
            {d.emojiCodes}
            {" "}
            {RenderText(translationEntry.text)}
            {" "}
        </div>
        <div className="col-auto">
            {RenderSource(translationEntry)}
        </div>
    </div>;
}

export function RenderTranslations(translations: OpenArabDictTranslationEntry[])
{
    if(translations.length === 1)
        return RenderTranslationEntry(translations[0]);

    return <ol>{translations.map(x => <li>{RenderTranslationEntry(x)}</li>)}</ol>;
}