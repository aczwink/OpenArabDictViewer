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

import { APIController, Get, Path, Query } from "acts-util-apilib";
import { RootsController } from "../data-access/RootsController";
import { WordsController } from "../data-access/WordsController";
import { RootsIndexService } from "../services/RootsIndexService";

@APIController("roots")
class _api_
{
    constructor(private rootsController: RootsController)
    {
    }

    @Get()
    public async QueryRoots(
        @Query prefix: string
    )
    {
        return await this.rootsController.QueryRoots(prefix);
    }
}

@APIController("roots/{rootId}")
class _api2_
{
    constructor(private wordsController: WordsController, private rootsIndexService: RootsIndexService,)
    {
    }

    @Get()
    public QueryRoot(
        @Path rootId: number
    )
    {
        return this.rootsIndexService.GetRoot(rootId);
    }

    @Get("words")
    public async QueryRootDerivedWords(
        @Path rootId: number
    )
    {
        return (await this.wordsController.QueryRootDerivedWords(rootId)).PromiseAll();
    }
}