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
import { JSX_CreateElement } from "@aczwink/acfrontend";
import { ToDiffStream, DisplayVocalized, VocalizedWordTostring } from "@aczwink/openarabicconjugation/dist/Vocalization";

export function RenderWithDiffHighlights(word: DisplayVocalized[], reference: DisplayVocalized[])
{
    if(navigator.userAgent.includes("AppleWebKit/")) //doesn't work in webkit -.- https://bugs.webkit.org/show_bug.cgi?id=6148
        return VocalizedWordTostring(word);

    const diff = ToDiffStream(word, reference);

    let hasLeadingDiff = false;
    if(diff[0].char === "\u2610")
    {
        hasLeadingDiff = true;
        diff.Remove(0);
    }
    let hasTrailingDiff = false;
    if(diff[diff.length - 1].char === "\u2610")
    {
        hasTrailingDiff = true;
        diff.Remove(diff.length - 1);
    }

    const rendered = diff.Values().GroupAdjacent(x => x.diff + "-" + x.emphasis).Map(x => {
        const text = x.map(y => y.char);
        if(x[0].diff && x[0].emphasis)
            return <span className="text-success">{text}</span>;
        if(x[0].diff)
            return <span className="text-danger">{text}</span>;
        if(x[0].emphasis)
            return <span className="text-primary">{text}</span>;
        return text;
    }).ToArray();

    //trailing and beginning need to be switched
    if(hasLeadingDiff)
        rendered.push(<span className="text-danger">{"\u2610"}</span>);
    if(hasTrailingDiff)
        rendered.unshift(<span className="text-danger">{"\u2610"}</span>);

    return rendered;
}