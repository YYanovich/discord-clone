"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = exports.ChannelType = void 0;
const typeorm_1 = require("typeorm");
const guild_entity_1 = require("./guild.entity");
const category_entity_1 = require("./category.entity");
var ChannelType;
(function (ChannelType) {
    ChannelType["TEXT"] = "TEXT";
    ChannelType["VOICE"] = "VOICE";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
let Channel = class Channel {
};
exports.Channel = Channel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Channel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Channel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ChannelType,
        default: ChannelType.TEXT,
    }),
    __metadata("design:type", String)
], Channel.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => guild_entity_1.Guild, (guild) => guild.channels, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'guildId' }),
    __metadata("design:type", guild_entity_1.Guild)
], Channel.prototype, "guild", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Channel.prototype, "guildId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (category) => category.channels, {
        onDelete: 'CASCADE',
        nullable: true,
    }),
    __metadata("design:type", category_entity_1.Category)
], Channel.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Channel.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Channel.prototype, "position", void 0);
exports.Channel = Channel = __decorate([
    (0, typeorm_1.Entity)('channels')
], Channel);
//# sourceMappingURL=channel.entity.js.map