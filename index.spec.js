"use strict";
var _1 = require('.');
var chai_1 = require('chai');
describe('AngularBlueprint', function () {
    var blueprint;
    beforeEach(function () {
        blueprint = new _1.AngularBlueprint();
    });
    describe('parseMessage()', function () {
        it('should return a Commit with `isRevert` true if the msg starts with "revert:"', function () {
            var commit = blueprint.parseMessage('ABC123\nrevert:fix(abc): some title\nSome body\nSome more body');
            chai_1.expect(commit.isRevert).to.equal(true);
        });
        it('should return a Commit with `isRevert` true if the msg starts with "Revert "', function () {
            var commit = blueprint.parseMessage('ABC123\nRevert "fix(abc): some title"\nSome body\nSome more body');
            chai_1.expect(commit.isRevert).to.equal(true);
        });
        it('should strip any double quotes from around the revert header', function () {
            var commit = blueprint.parseMessage('ABC123\nRevert "fix(abc): some title"\nSome body\nSome more body');
            chai_1.expect(commit.type).to.equal('fix');
            chai_1.expect(commit.type).to.equal('fix');
            chai_1.expect(commit.scope).to.equal('abc');
            chai_1.expect(commit.title).to.equal('some title');
            chai_1.expect(commit.body).to.equal('Some body\nSome more body');
        });
        it('should extract a Commit from the msg', function () {
            var commit = blueprint.parseMessage('ABC123\nfix(abc): some title\nSome body\nSome more body');
            chai_1.expect(commit.hash).to.equal('ABC123');
            chai_1.expect(commit.isRevert).to.equal(false);
            chai_1.expect(commit.type).to.equal('fix');
            chai_1.expect(commit.scope).to.equal('abc');
            chai_1.expect(commit.title).to.equal('some title');
            chai_1.expect(commit.body).to.equal('Some body\nSome more body');
        });
        it('should extract the Breaking Change block', function () {
            var commit = blueprint.parseMessage('ABC123\nfix(abc): some title\nSome body\nBREAKING CHANGE:\nSome breaking change');
            chai_1.expect(commit.bcMessage).to.equal('Some breaking change');
        });
        it('should extract the closes markers', function () {
            var commit = blueprint.parseMessage('ABC123\nfix(abc): some title\nSome closes #44 body\nBREAKING CHANGE:\nSome breaking closes abc/def#23 change');
            chai_1.expect(commit.body).to.equal('Some body');
            chai_1.expect(commit.bcMessage).to.equal('Some breaking change');
            chai_1.expect(commit.closes).to.eql([{ org: undefined, repo: undefined, id: '44' }, { org: 'abc', repo: 'def', id: '23' }]);
        });
        it('should extract the closes markers at the start of the body text', function () {
            var commit = blueprint.parseMessage('ABC123\nfix(abc): some title\nCloses #44');
            chai_1.expect(commit.body).to.equal('');
            chai_1.expect(commit.bcMessage).to.equal('');
            chai_1.expect(commit.closes).to.eql([{ org: undefined, repo: undefined, id: '44' }]);
        });
        it('should cope with closes markers back to back', function () {
            var commit = blueprint.parseMessage('ABC123\nfix(abc): some title\nCloses #44\nCloses #54\n\nFixes #12');
            chai_1.expect(commit.body).to.equal('');
            chai_1.expect(commit.bcMessage).to.equal('');
            chai_1.expect(commit.closes).to.eql([
                { org: undefined, repo: undefined, id: '44' },
                { org: undefined, repo: undefined, id: '54' },
                { org: undefined, repo: undefined, id: '12' }
            ]);
        });
    });
});
