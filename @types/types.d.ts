type DialogType = 'info' | 'confirm' | 'question';

interface ISaver {
  owner: string;
  repo: string;
  branch: string;
  wikiFolder: string;
  GITHUB_TOKEN: string;
  COMMIT_MESSAGE?: string;
}

interface CommitBody {
  message: string;
  content: string;
  branch: string;
  sha?: string; // 可选的 SHA 属性
}
