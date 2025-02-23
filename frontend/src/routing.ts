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

import { Routes } from "acfrontend";
import { LearnComponent } from "./LearnComponent";
import { StatisticsComponent } from "./StatisticsComponent";
import { GlobalSearchComponent } from "./GlobalSearchComponent";
import { ShowWordComponent } from "./words/ShowWordComponent";
import { ListRootsComponent } from "./roots/ListRootsComponent";
import { ShowRootComponent } from "./roots/ShowRootComponent";



export const rootsRoutes : Routes = [
    { path: ":rootId", component: ShowRootComponent },
    { path: "", component: ListRootsComponent },
];

const wordsRoutes: Routes = [
    { path: ":wordId", component: ShowWordComponent },
];

export const routes : Routes = [
    { path: "learn", component: LearnComponent },
    { path: "roots", children: rootsRoutes },
    { path: "search", component: GlobalSearchComponent },
    { path: "statistics", component: StatisticsComponent },
    { path: "words", children: wordsRoutes },
    { path: "", redirect: "search" },
    //{ path: "*", component: } 404
];