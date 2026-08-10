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
exports.GuildParticipant = exports.GuildPermission = exports.ParticipantStatus = void 0;
const typeorm_1 = require("typeorm");
const guild_entity_1 = require("./guild.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["WAITING_ADMIN_APPROVE"] = "WAITING_ADMIN_APPROVE";
    ParticipantStatus["ADMIN_REJECTED"] = "ADMIN_REJECTED";
    ParticipantStatus["PARTICIPANT"] = "PARTICIPANT";
    ParticipantStatus["WAITING_USER_ACCEPTANCE"] = "WAITING_USER_ACCEPTANCE";
    ParticipantStatus["USER_REJECTED_INVITE"] = "USER_REJECTED_INVITE";
    ParticipantStatus["BLOCKED"] = "BLOCKED";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
var GuildPermission;
(function (GuildPermission) {
    GuildPermission[GuildPermission["VIEW_CHANNELS"] = 1] = "VIEW_CHANNELS";
    GuildPermission[GuildPermission["SEND_MESSAGES"] = 2] = "SEND_MESSAGES";
    GuildPermission[GuildPermission["CREATE_CHANNEL"] = 4] = "CREATE_CHANNEL";
    GuildPermission[GuildPermission["INVITE_USER"] = 8] = "INVITE_USER";
    GuildPermission[GuildPermission["DELETE_USER"] = 16] = "DELETE_USER";
    GuildPermission[GuildPermission["EDIT_GUILD"] = 32] = "EDIT_GUILD";
    GuildPermission[GuildPermission["ADMINISTRATOR"] = 64] = "ADMINISTRATOR";
})(GuildPermission || (exports.GuildPermission = GuildPermission = {}));
let GuildParticipant = class GuildParticipant {
};
exports.GuildParticipant = GuildParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GuildParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => guild_entity_1.Guild, { onDelete: 'CASCADE' }),
    __metadata("design:type", guild_entity_1.Guild)
], GuildParticipant.prototype, "guild", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GuildParticipant.prototype, "guildId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], GuildParticipant.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GuildParticipant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GuildParticipant.prototype, "inviterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: GuildPermission.VIEW_CHANNELS | GuildPermission.SEND_MESSAGES }),
    __metadata("design:type", Number)
], GuildParticipant.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParticipantStatus,
        default: ParticipantStatus.PARTICIPANT,
    }),
    __metadata("design:type", String)
], GuildParticipant.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GuildParticipant.prototype, "joinedAt", void 0);
exports.GuildParticipant = GuildParticipant = __decorate([
    (0, typeorm_1.Entity)('guild_participants'),
    (0, typeorm_1.Index)(['guildId', 'userId'], { unique: true })
], GuildParticipant);
//# sourceMappingURL=guild-participant.entity.js.map