// Console output: banner, bordered cards, chalk styling, OSC-8 hyperlinks for Wikipedia URLs.
import chalk from "chalk";
import { BOX_CONTENT_WIDTH } from "./config";
import { wikipediaSearchUrl } from "./links/wikipedia";
import type { SearchResult } from "./types";

const boxLine = (text: string, textLen: number, border: string, fill = " "): string => {
  const gap = Math.max(0, BOX_CONTENT_WIDTH - textLen);
  return `  ${border} ${text}${fill.repeat(gap)} ${border}`;
};

const wrapText = (text: string, maxWidth: number): string[] => {
  if (maxWidth < 1) return [text];

  const breakChunk = (chunk: string): string[] => {
    const out: string[] = [];
    let rest = chunk;
    while (rest.length > maxWidth) {
      out.push(rest.slice(0, maxWidth));
      rest = rest.slice(maxWidth);
    }
    if (rest.length) out.push(rest);
    return out;
  };

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const pieces = breakChunk(word);
    for (const piece of pieces) {
      const needSpace = current.length > 0 ? 1 : 0;
      if (current.length + needSpace + piece.length > maxWidth) {
        if (current) lines.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
};

// OSC-8 escape sequence: clickable URL in supporting terminals.
const terminalLinkMuted = (url: string, label: string): string => {
  const ST = "\u001b\\";
  const styled = chalk.dim.italic.underline(label);
  return `\u001b]8;;${url}${ST}${styled}\u001b]8;;${ST}`;
};

export const printBanner = (url: string): void => {
  const INNER = BOX_CONTENT_WIDTH;
  const logo = [
    "  ____ _____  _    ____   __        ___    ____  ____",
    " / ___|_   _|/ \\  |  _ \\  \\ \\      / / \\  |  _ \\/ ___|",
    " \\___ \\ | | / _ \\ | |_) |  \\ \\ /\\ / / _ \\ | |_) \\___ \\",
    "  ___) || |/ ___ \\|  _ <    \\ V  V / ___ \\|  _ < ___) |",
    " |____/ |_/_/   \\_\\_| \\_\\    \\_/\\_/_/   \\_\\_| \\_\\____/",
  ];

  const titleText = "Character Search CLI";
  const connText = `Connected to ${url}`;
  const desc2 = "Enter a full or partial name, then press Enter.";
  const desc3 = 'e.g. "luke", "darth", "sky", "leia"';
  const exitText = "Press Ctrl+C to exit.";

  console.log("");
  logo.forEach((l) => console.log(chalk.yellow(l)));
  console.log("");

  const hBar = "═".repeat(INNER + 2);
  const hDiv = "─".repeat(INNER + 2);

  console.log(chalk.yellow(`  ╔${hBar}╗`));
  console.log(chalk.yellow(boxLine(chalk.bold.white(titleText), titleText.length, "║")));
  console.log(chalk.yellow(boxLine(chalk.dim(connText), connText.length, "║")));
  console.log(chalk.yellow(`  ╠${hDiv}╣`));
  console.log(chalk.yellow(boxLine(desc2, desc2.length, "║")));
  console.log(chalk.yellow(boxLine(chalk.dim(desc3), desc3.length, "║")));
  console.log(chalk.yellow(boxLine("", 0, "║")));
  console.log(chalk.yellow(boxLine(exitText, exitText.length, "║")));
  console.log(chalk.yellow(`  ╚${hBar}╝`));
  console.log("");
};

export const formatPrompt = (): string =>
  `\n  ${chalk.dim("Press Ctrl+C to exit.")}\n  ${chalk.white("Which character would you like to search for?")}\n  ${chalk.yellow(">")} `;

export const printSearching = (query: string): void => {
  console.log("");
  console.log(chalk.yellow(`  Looking up "${chalk.bold(query)}"...`));
  console.log("");
};

export const printResult = (result: SearchResult): void => {
  const INNER = BOX_CONTENT_WIDTH;
  const counter = `[${result.page}/${result.resultCount}]`;
  const nameText = `${counter} ${result.name}`;
  const filmsLabel = "Films: ";
  const filmsStr = result.films.join(", ");
  const filmsLines = wrapText(filmsStr, INNER - filmsLabel.length);

  const hBar = "─".repeat(INNER + 2);

  console.log(chalk.dim(`  ┌${hBar}┐`));
  console.log(boxLine(`${chalk.dim(counter)} ${chalk.bold.cyan(result.name)}`, nameText.length, chalk.dim("│")));

  filmsLines.forEach((fl, i) => {
    const prefix = i === 0 ? filmsLabel : " ".repeat(filmsLabel.length);
    const content = `${chalk.dim(prefix)}${chalk.white(fl)}`;
    const contentLen = prefix.length + fl.length;
    console.log(boxLine(content, contentLen, chalk.dim("│")));
  });

  const wikiUrl = wikipediaSearchUrl(result.name);
  const wikiTag = "Learn More · ";
  const wikiRow =
    chalk.gray.italic(wikiTag) + terminalLinkMuted(wikiUrl, result.name);
  console.log(boxLine(chalk.gray.dim("·".repeat(INNER)), INNER, chalk.dim("│")));

  console.log(boxLine(wikiRow, wikiTag.length + result.name.length, chalk.dim("│")));

  const urlLines = wrapText(wikiUrl, INNER);
  urlLines.forEach((ul) => {
    // Wrap the displayed URL text too, so the terminal keeps it as a valid hyperlink
    // across line breaks (some terminals auto-detect only the first wrapped line).
    console.log(boxLine(terminalLinkMuted(wikiUrl, ul), ul.length, chalk.dim("│")));
  });

  console.log(chalk.dim(`  └${hBar}┘`));
};

export const printSummary = (count: number): void => {
  console.log("");
  console.log(chalk.green(`  ${count} result${count !== 1 ? "s" : ""} found.`));
  console.log("");
};

export const printError = (message: string): void => {
  console.log("");
  console.log(chalk.red(`  Error: ${message}`));
  console.log("");
};

export const printGoodbye = (): void => {
  console.log("");
  console.log(chalk.yellow("  Disconnected. May the Force be with you!"));
  console.log("");
};
