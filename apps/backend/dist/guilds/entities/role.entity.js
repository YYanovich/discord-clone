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
exports.Role = exports.PermissionFlag = void 0;
const typeorm_1 = require("typeorm");
const guild_entity_1 = require("./guild.entity");
var PermissionFlag;
(function (PermissionFlag) {
    PermissionFlag[PermissionFlag["VIEW_CHANNEL"] = 1] = "VIEW_CHANNEL";
    PermissionFlag[PermissionFlag["SEND_MESSAGES"] = 2] = "SEND_MESSAGES";
    PermissionFlag[PermissionFlag["MANAGE_MESSAGES"] = 4] = "MANAGE_MESSAGES";
    PermissionFlag[PermissionFlag["MANAGE_CHANNELS"] = 8] = "MANAGE_CHANNELS";
    PermissionFlag[PermissionFlag["MANAGE_ROLES"] = 16] = "MANAGE_ROLES";
    PermissionFlag[PermissionFlag["KICK_MEMBERS"] = 32] = "KICK_MEMBERS";
    PermissionFlag[PermissionFlag["BAN_MEMBERS"] = 64] = "BAN_MEMBERS";
    PermissionFlag[PermissionFlag["ADMINISTRATOR"] = 128] = "ADMINISTRATOR";
})(PermissionFlag || (exports.PermissionFlag = PermissionFlag = {}));
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], Role.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => guild_entity_1.Guild, { onDelete: 'CASCADE' }),
    __metadata("design:type", guild_entity_1.Guild)
], Role.prototype, "guild", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Role.prototype, "guildId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Role.prototype, "position", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('roles')
], Role);
//# sourceMappingURL=role.entity.js.map