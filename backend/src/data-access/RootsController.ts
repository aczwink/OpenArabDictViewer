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

import { Injectable } from "@aczwink/acts-util-node";
import { DatabaseController } from "./DatabaseController";
import { Letter } from "@aczwink/openarabicconjugation/dist/Definitions";
import { OpenArabDictRoot } from "@aczwink/openarabdict-domain";

@Injectable
export class RootsController
{
    constructor(private dbController: DatabaseController)
    {
    }

    //Public methods
    public async QueryRoots(prefix: string)
    {
        const document = await this.dbController.GetDocumentDB();

        const filtered = document.roots.Values().Filter(this.Matches.bind(this, prefix));
        return filtered.OrderBy(x => x.radicals).ToArray();
    }

    //Private methods
    private Matches(prefix: string, root: OpenArabDictRoot)
    {
        if((prefix[1] === Letter.Ya) && (root.radicals[1] === Letter.Waw) && (root.ya === true))
        {
            const prefixWithWaw = prefix[0] + Letter.Waw + prefix.substring(2);
            if(root.radicals.startsWith(prefixWithWaw))
                return true;
        }

        return root.radicals.startsWith(prefix);
    }
}