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

import { BootstrapIcon, JSX_CreateElement, JSX_Fragment, RootInjector } from "acfrontend";
import { DialectsService } from "../services/DialectsService";
import { OpenArabDictTranslationEntry, UsageType } from "../../dist/api";

function RenderExample(example: { text: string; translation: string; }): RenderValue
{
    return <p>{example.text} - {example.translation}</p>;
}

function RenderExamples(examples?: { text: string; translation: string; }[])
{
    if((examples === undefined) || (examples.length === 0))
        return null;

    if(examples.length === 1)
    {
        return <>
        <h6>Example:</h6>
        {RenderExample(examples[0])}
    </>;
    }

    return <>
        <h6>Examples:</h6>
        <ul>{examples.map(x => <li>{RenderExample(x)}</li>)}</ul>
    </>;
}

function RenderContextDependentMeanings(contextual?: { text: string; translation: string; }[])
{
    if((contextual === undefined) || (contextual.length === 0))
        return null;

    if(contextual.length === 1)
    {
        return <>
        <h6>Meaning in context:</h6>
        {RenderExample(contextual[0])}
    </>;
    }

    return <>
        <h6>Meaning in context:</h6>
        <ul>{contextual.map(x => <li>{RenderExample(x)}</li>)}</ul>
    </>;
}

function RenderText(text: string[])
{
    if(text.length === 0)
        return null;
    if(text.length === 1)
        return text[0];
    return <ul className="mb-0">
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

    const examples = translationEntry.usage?.filter(x => x.type === UsageType.Example);
    const contextual = translationEntry.usage?.filter(x => x.type === UsageType.MeaningInContext);

    return <div className="row">
        <div className="col-auto">
            {d.emojiCodes}
        </div>
        <div className="col" style="white-space: pre-wrap;">
            {RenderText(translationEntry.text)}
        </div>
        <div className="col-auto">
            {RenderSource(translationEntry)}
        </div>
        {RenderExamples(examples)}
        {RenderContextDependentMeanings(contextual)}
    </div>;
}

export function RenderTranslations(translations: OpenArabDictTranslationEntry[])
{
    if(translations.length === 1)
        return RenderTranslationEntry(translations[0]);

    const entries = translations.map(x => RenderTranslationEntry(x));
    return entries.Interleave(<hr className="my-1" />);
}