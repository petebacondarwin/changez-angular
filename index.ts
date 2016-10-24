import {resolve} from 'path';
import {Commit, IBlueprint} from 'changez';

//                       111111111111111
//                              2222222 3333
const REVERT_MATCHER = /^(revert(:?\s*))(.+)/i;

//                      1111111  2222222         3333
const FORMAT_MATCHER = /([^(]+)\(([^)]+)\)\s*:\s*(.+)/;
// 1=type; 2=scope; 3=title

const BC_MARKER = /^BREAKING CHANGE(S?:?\s*)/i;

//                         1111111111111111111111111111111111111111111111
//                          2222222222222 4444444444444 666666666666666    88888888888888888888888888
//                                33333       5555555           77777       999999999999999999 101010
const CLOSES_MATCHER = /\s+((close(s|d)?)|(fix(es|ed)?)|(resolve(s|d)?))\s+(([^\/ ]+\/[^\/ ]+)?(#\d+))\s+/ig;
// 8 = hash or url/hash to close

let typeWhiteList = ['feat', 'fix', 'perf'];
export function setWhitelist(value: string[]) {
  typeWhiteList = value;
}

let typeBlackList = ['chore', 'refactor', 'docs', 'style', 'test'];
export function setBlacklist(value: string[]) {
  typeBlackList = value;
}

export class AngularBlueprint implements IBlueprint {

  name = 'Angular';

  getTemplateFolder(): string {
    return resolve(__dirname, 'templates');
  }

  getTemplateName(): string {
    return 'changelog.njk';
  }

  parseMessage(message: string): Commit {
    const commit = new Commit(message);
    let [hash, header, ...bodyLines] = message.split('\n');

    commit.hash = hash;

    header = header.replace(REVERT_MATCHER, (_, revertMarker, __, rest: string) => {
      commit.isRevert = true;
      if (rest.indexOf('"') === 0 && rest.lastIndexOf('"') === rest.length - 1) {
        rest = rest.substring(1, rest.length - 1);
      }
      return rest;
    });

    const matches = FORMAT_MATCHER.exec(header);
    if (!matches) return null;

    [, commit.type, commit.scope, commit.title] = matches;
    let bcLine = 0;
    while (bcLine < bodyLines.length) {
      if (BC_MARKER.test(bodyLines[bcLine])) break;
      bcLine += 1;
    }
    commit.body = bodyLines.slice(0, bcLine).join('\n');
    commit.bcMessage = bodyLines.slice(bcLine).join('\n').replace(BC_MARKER, '');
    commit.closes = [];
    commit.body = extractCloses(commit.body, commit.closes);
    commit.bcMessage = extractCloses(commit.bcMessage, commit.closes);

    if (commit.isRevert) {
      // Create a revert commit that matches this commit
      const revertCommit = new Commit();
      revertCommit.type = commit.type;
      revertCommit.scope = commit.scope;
      revertCommit.title = commit.title;
      commit.revertCommit = revertCommit;
    }

    return commit;
  }

  filterCommit(commit: Commit) {
    if (typeBlackList.indexOf(commit.type) !== -1) return false;
    if (typeWhiteList.indexOf(commit.type) !== -1) return true;
    console.log(commit.type);
    throw new Error(`Commit ${commit.hash} does not match a type in either the whitelist nor the blacklist`);
  }

  compareCommits(left: Commit, right: Commit) {
    return left.toString() === right.toString();
  }
}


function extractCloses(field: string, closes: string[]): string {
  return field.replace(CLOSES_MATCHER, function() {
    closes.push(arguments[8]);
    return ' ';
  });
}

export default new AngularBlueprint();