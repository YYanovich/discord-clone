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
exports.ChannelParticipant = exports.ChannelPermission = void 0;
const typeorm_1 = require("typeorm");
const channel_entity_1 = require("./channel.entity");
const participant_status_enum_1 = require("./participant-status.enum");
var ChannelPermission;
(function (ChannelPermission) {
    ChannelPermission[ChannelPermission["READ"] = 1] = "READ";
    ChannelPermission[ChannelPermission["WRITE"] = 2] = "WRITE";
    ChannelPermission[ChannelPermission["INVITE"] = 4] = "INVITE";
    ChannelPermission[ChannelPermission["DELETE"] = 8] = "DELETE";
    ChannelPermission[ChannelPermission["MANAGE"] = 16] = "MANAGE";
})(ChannelPermission || (exports.ChannelPermission = ChannelPermission = {}));
let ChannelParticipant = class ChannelParticipant {
};
exports.ChannelParticipant = ChannelParticipant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChannelParticipant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => channel_entity_1.Channel, { onDelete: 'CASCADE' }),
    __metadata("design:type", channel_entity_1.Channel)
], ChannelParticipant.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChannelParticipant.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChannelParticipant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChannelParticipant.prototype, "inviterId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        default: ChannelPermission.READ | ChannelPermission.WRITE,
    }),
    __metadata("design:type", Number)
], ChannelParticipant.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: participant_status_enum_1.ParticipantStatus,
        default: participant_status_enum_1.ParticipantStatus.PARTICIPANT,
    }),
    __metadata("design:type", String)
], ChannelParticipant.prototype, "status", void 0);
exports.ChannelParticipant = ChannelParticipant = __decorate([
    (0, typeorm_1.Entity)('channel_participants'),
    (0, typeorm_1.Index)(['channelId', 'userId'], { unique: true })
], ChannelParticipant);
//# sourceMappingURL=channel-participant.entity.js.map