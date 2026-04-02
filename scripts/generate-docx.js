const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  AlignmentType,
  PageOrientation,
} = require('docx');
const fs = require('fs');
const path = require('path');

const mdContent = fs.readFileSync(
  path.join(__dirname, '../docs/v1/开题报告.md'),
  'utf8'
);

function parseMarkdownToDocx(mdText) {
  const children = [];

  const lines = mdText.split('\n');
  let i = 0;

  function parseTextWithFormatting(text) {
    const runs = [];
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    const italicRegex = /(?<!\*)(\*|_)(.+?)(?<!\*)\1/g;

    let lastIndex = 0;
    let match;
    const processedText = text;

    const boldMatches = [];
    while ((match = boldRegex.exec(processedText)) !== null) {
      boldMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[2],
        type: 'bold',
      });
    }

    boldMatches.sort((a, b) => a.start - b.start);

    let currentIndex = 0;
    for (const boldMatch of boldMatches) {
      if (boldMatch.start > currentIndex) {
        runs.push(
          new TextRun({
            text: processedText.substring(currentIndex, boldMatch.start),
            font: '宋体',
            size: 21,
          })
        );
      }
      runs.push(
        new TextRun({
          text: boldMatch.text,
          bold: true,
          font: '宋体',
          size: 21,
        })
      );
      currentIndex = boldMatch.end;
    }

    if (currentIndex < processedText.length) {
      runs.push(
        new TextRun({
          text: processedText.substring(currentIndex),
          font: '宋体',
          size: 21,
        })
      );
    }

    return runs.length > 0
      ? runs
      : [new TextRun({ text: text, font: '宋体', size: 21 })];
  }

  function addParagraph(text, heading = null, spacing = {}) {
    const runs = parseTextWithFormatting(text);

    const para = new Paragraph({
      children: runs,
      heading: heading,
      alignment: AlignmentType.LEFT,
      spacing: spacing,
    });
    return para;
  }

  function addHeading(text, level) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true,
          font: '黑体',
          size: getHeadingSize(level),
        }),
      ],
      heading: level,
      spacing: { before: 240, after: 120 },
    });
  }

  function getHeadingSize(level) {
    switch (level) {
      case HeadingLevel.HEADING_1:
        return 32;
      case HeadingLevel.HEADING_2:
        return 28;
      case HeadingLevel.HEADING_3:
        return 24;
      case HeadingLevel.HEADING_4:
        return 22;
      case HeadingLevel.HEADING_5:
        return 20;
      case HeadingLevel.HEADING_6:
        return 18;
      case HeadingLevel.HEADING_7:
        return 16;
      default:
        return 24;
    }
  }

  function getHeadingLevel(hashCount) {
    switch (hashCount) {
      case 1:
        return HeadingLevel.HEADING_1;
      case 2:
        return HeadingLevel.HEADING_2;
      case 3:
        return HeadingLevel.HEADING_3;
      case 4:
        return HeadingLevel.HEADING_4;
      case 5:
        return HeadingLevel.HEADING_5;
      case 6:
        return HeadingLevel.HEADING_6;
      case 7:
        return HeadingLevel.HEADING_7;
      default:
        return HeadingLevel.HEADING_1;
    }
  }

  const border = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const tableBorder = {
    top: border,
    bottom: border,
    left: border,
    right: border,
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    const headingMatch = line.match(/^(#{1,7})\s+(.+)/);

    if (headingMatch) {
      const hashCount = headingMatch[1].length;
      const headingText = headingMatch[2];
      const level = getHeadingLevel(hashCount);
      children.push(addHeading(headingText, level));
    } else if (line.startsWith('| ') && line.endsWith(' |')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        if (!row.includes('---')) {
          const cells = row.split('|').filter((cell) => cell.trim() !== '');
          tableLines.push(cells);
        }
        i++;
      }
      i--;

      if (tableLines.length > 0) {
        const rows = tableLines.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    borders: tableBorder,
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell.trim(),
                            font: '宋体',
                            size: 21,
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            })
        );

        children.push(
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4680, 4680],
            rows: rows,
          })
        );
      }
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletItems = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        const itemText = lines[i].trim().substring(2);
        const runs = parseTextWithFormatting(itemText);
        bulletItems.push(
          new Paragraph({
            children: runs,
            spacing: { line: 300 },
          })
        );
        i++;
      }
      i--;
      children.push(...bulletItems);
    } else if (line.match(/^\d+\.\s/)) {
      const numMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        const runs = parseTextWithFormatting(line);
        children.push(
          new Paragraph({
            children: runs,
            spacing: { line: 300 },
          })
        );
      }
    } else if (line.startsWith('[') && line.match(/\]\[/)) {
      const runs = parseTextWithFormatting(line);
      children.push(
        new Paragraph({
          children: runs,
          spacing: { line: 300 },
        })
      );
    } else if (line.length > 0) {
      const processedLine = line
        .replace(/^\d+\)\s*/, '')
        .replace(/\[\d+\]/g, '');
      if (processedLine.length > 0) {
        const runs = parseTextWithFormatting(processedLine);
        children.push(
          new Paragraph({
            children: runs,
            spacing: { line: 300 },
          })
        );
      }
    }
    i++;
  }

  return children;
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: '宋体', size: 21 },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 32, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 240, after: 240 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 28, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 180, after: 180 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 24, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 120, after: 120 } },
      },
      {
        id: 'Heading4',
        name: 'Heading 4',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 22, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 100, after: 100 } },
      },
      {
        id: 'Heading5',
        name: 'Heading 5',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 20, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 80, after: 80 } },
      },
      {
        id: 'Heading6',
        name: 'Heading 6',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 18, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 60, after: 60 } },
      },
      {
        id: 'Heading7',
        name: 'Heading 7',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: 16, bold: true, font: '黑体' },
        paragraph: { spacing: { before: 40, after: 40 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: parseMarkdownToDocx(mdContent),
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const tempPath = path.join(__dirname, '../docs/v1/开题报告_新.docx');
  const outputPath = path.join(__dirname, '../docs/v1/开题报告.docx');

  fs.writeFileSync(tempPath, buffer);

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  fs.renameSync(tempPath, outputPath);

  console.log('Document created:', outputPath);
});
