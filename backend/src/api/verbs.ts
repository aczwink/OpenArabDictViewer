/**
 * ArabDict
 * Copyright (C) 2023 Amir Czwink (amir130@hotmail.de)
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

import { APIController, Body, BodyProp, Delete, Get, Post, Put, Query } from "acts-util-apilib";
import { VerbCreationData, VerbUpdateData, VerbsController } from "../data-access/VerbsController";
import { WordCreationData, WordsController } from "../data-access/WordsController";

@APIController("verbs")
class _api_
{
    constructor(private verbsController: VerbsController)
    {
    }

    @Post()
    public async CreateVerb(
        @Body data: VerbCreationData
    )
    {
        return await this.verbsController.CreateVerb(data);
    }

    @Get()
    public async QueryVerb(
        @Query verbId: number
    )
    {
        return await this.verbsController.QueryVerb(verbId);
    }

    @Put()
    public async UpdateVerb(
        @BodyProp verbId: number,
        @BodyProp data: VerbUpdateData
    )
    {
        await this.verbsController.UpdateVerb(verbId, data);
    }
}

@APIController("verbs/words")
class _api2_
{
    constructor(private wordsController: WordsController)
    {
    }

    @Post()
    public async CreateWord(
        @Body data: WordCreationData
    )
    {
        return await this.wordsController.CreateWord(data);
    }

    @Delete()
    public async DeleteWord(
        @BodyProp wordId: number,
    )
    {
        await this.wordsController.DeleteWord(wordId);
    }

    @Get()
    public async QueryVerbDerivedWords(
        @Query verbId: number
    )
    {
        return await this.wordsController.QueryVerbDerivedWords(verbId);
    }

    @Put()
    public async UpdateWordTranslation(
        @BodyProp wordId: number,
        @BodyProp translation: string
    )
    {
        return await this.wordsController.UpdateWordTranslation(wordId, translation);
    }
}