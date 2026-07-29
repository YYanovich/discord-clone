"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_service_1 = require("./elasticsearch.service");
const search_consumer_1 = require("./search.consumer");
const search_controller_1 = require("./search.controller");
const guilds_module_1 = require("../guilds/guilds.module");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        imports: [guilds_module_1.GuildsModule],
        providers: [elasticsearch_service_1.ElasticsearchService, search_consumer_1.SearchConsumer],
        controllers: [search_controller_1.SearchController],
        exports: [elasticsearch_service_1.ElasticsearchService],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map