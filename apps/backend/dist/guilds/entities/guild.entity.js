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
exports.Guild = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const category_entity_1 = require("./category.entity");
const channel_entity_1 = require("./channel.entity");
const membership_entity_1 = require("./membership.entity");
let Guild = class Guild {
};
exports.Guild = Guild;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Guild.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Guild.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Guild.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Guild.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Guild.prototype, "iconUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => category_entity_1.Category, (category) => category.guild, { cascade: true }),
    __metadata("design:type", Array)
], Guild.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => channel_entity_1.Channel, (channel) => channel.guild, { cascade: true }),
    __metadata("design:type", Array)
], Guild.prototype, "channels", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => membership_entity_1.Membership, (membership) => membership.guild, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Guild.prototype, "memberships", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Guild.prototype, "createdAt", void 0);
exports.Guild = Guild = __decorate([
    (0, typeorm_1.Entity)('guilds')
], Guild);
//# sourceMappingURL=guild.entity.js.map