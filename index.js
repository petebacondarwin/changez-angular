"use strict";
var path_1 = require('path');
var changez_1 = require('changez');
var nunjucksDate = require('nunjucks-date');
//                       111111111111111
//                              2222222 3333
var REVERT_MATCHER = /^(revert(:?\s*))(.+)/i;
//                      1111111  2222222         3333
var FORMAT_MATCHER = /([^(]+)\(([^)]+)\)\s*:\s*(.+)/;
// 1=type; 2=scope; 3=title
var BC_MARKER = /^BREAKING CHANGE(S?:?\s*)/i;
//                               111111111111111111111111111111111111111111111
//                                2222222222222 4444444444444 666666666666666    8888888888888888888888888888888
//                                      33333       5555555           77777       9999999999999999999999
//                                                                                 10101010   111111111   1212
var CLOSES_MATCHER = /(?:^|\s+)((close(s|d)?)|(fix(es|ed)?)|(resolve(s|d)?))\s+((([^\/ ]+)\/([^\/ ]+))?#(\d+))(?=\s|$)/ig;
// 10 = org; 11 = repo; 12=issue
var typeWhiteList = ['feat', 'fix', 'perf'];
function setWhitelist(value) {
    typeWhiteList = value;
}
exports.setWhitelist = setWhitelist;
var typeBlackList = ['chore', 'refactor', 'docs', 'style', 'test'];
function setBlacklist(value) {
    typeBlackList = value;
}
exports.setBlacklist = setBlacklist;
var AngularBlueprint = (function () {
    function AngularBlueprint() {
        this.name = 'Angular';
    }
    AngularBlueprint.prototype.getTemplateFolder = function () {
        return path_1.resolve(__dirname, 'templates');
    };
    AngularBlueprint.prototype.getTemplateName = function () {
        return 'changelog.njk';
    };
    AngularBlueprint.prototype.parseMessage = function (message) {
        var commit = new changez_1.Commit(message);
        var _a = message.split('\n'), hash = _a[0], header = _a[1], bodyLines = _a.slice(2);
        commit.hash = hash;
        header = header.replace(REVERT_MATCHER, function (_, revertMarker, __, rest) {
            commit.isRevert = true;
            if (rest.indexOf('"') === 0 && rest.lastIndexOf('"') === rest.length - 1) {
                rest = rest.substring(1, rest.length - 1);
            }
            return rest;
        });
        var matches = FORMAT_MATCHER.exec(header);
        if (!matches)
            return null;
        commit.type = matches[1], commit.scope = matches[2], commit.title = matches[3];
        var bcLine = 0;
        while (bcLine < bodyLines.length) {
            if (BC_MARKER.test(bodyLines[bcLine]))
                break;
            bcLine += 1;
        }
        commit.body = bodyLines.slice(0, bcLine).join('\n');
        commit.bcMessage = bodyLines.slice(bcLine).join('\n').replace(BC_MARKER, '');
        commit.closes = [];
        commit.body = extractCloses(commit.body, commit.closes);
        commit.bcMessage = extractCloses(commit.bcMessage, commit.closes);
        if (commit.isRevert) {
            // Create a revert commit that matches this commit
            var revertCommit = new changez_1.Commit();
            revertCommit.type = commit.type;
            revertCommit.scope = commit.scope;
            revertCommit.title = commit.title;
            commit.revertCommit = revertCommit;
        }
        return commit;
    };
    AngularBlueprint.prototype.filterCommit = function (commit) {
        if (typeBlackList.indexOf(commit.type) !== -1)
            return false;
        if (typeWhiteList.indexOf(commit.type) !== -1)
            return true;
        console.log(commit.type);
        throw new Error("Commit " + commit.hash + " does not match a type in either the whitelist nor the blacklist");
    };
    AngularBlueprint.prototype.compareCommits = function (left, right) {
        return left.toString() === right.toString();
    };
    AngularBlueprint.prototype.configureRenderer = function (env) {
        nunjucksDate.install(env);
        nunjucksDate.setDefaultFormat('YYYY-MM-DD');
    };
    return AngularBlueprint;
}());
exports.AngularBlueprint = AngularBlueprint;
function extractCloses(field, closes) {
    return field.replace(CLOSES_MATCHER, function () {
        closes.push({
            org: arguments[10],
            repo: arguments[11],
            id: arguments[12]
        });
        return '';
    }).trim();
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new AngularBlueprint();
