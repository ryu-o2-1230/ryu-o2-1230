const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 30, font: "MS Mincho" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "MS Mincho" })] });
}
function body(runs) {
  if (typeof runs === 'string') runs = [new TextRun({ text: runs, size: 22, font: "MS Mincho" })];
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80, line: 360 }, children: runs });
}
function example(num, jp, gloss, trans) {
  const rows = [new TableRow({ children: [
    new TableCell({ borders: noBorders, width: { size: 500, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: num ? `(${num})` : "", size: 22, font: "MS Mincho" })] })] }),
    new TableCell({ borders: noBorders, width: { size: 8500, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: jp, size: 22, font: "MS Mincho" })] })] })
  ]})];
  if (gloss) rows.push(new TableRow({ children: [
    new TableCell({ borders: noBorders, width: { size: 500, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
    new TableCell({ borders: noBorders, width: { size: 8500, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: gloss, size: 20, font: "Times New Roman", italics: true })] })] })
  ]}));
  if (trans) rows.push(new TableRow({ children: [
    new TableCell({ borders: noBorders, width: { size: 500, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
    new TableCell({ borders: noBorders, width: { size: 8500, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: `'${trans}'`, size: 22, font: "Times New Roman" })] })] })
  ]}));
  return new Table({ width: { size: 9000, type: WidthType.DXA }, columnWidths: [500, 8500], rows });
}
function sp(n=1) { return new Paragraph({ spacing: { before: 0, after: n * 80 }, children: [] }); }
function todo(text) {
  return new Paragraph({ indent: { left: 360, right: 360 }, spacing: { before: 80, after: 80 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "CC0000", space: 6 } },
    children: [
      new TextRun({ text: "【要検討】", bold: true, color: "CC0000", size: 22, font: "MS Mincho" }),
      new TextRun({ text: " " + text, size: 22, font: "MS Mincho", color: "CC0000" })
    ] });
}
function formula(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, indent: { left: 720 },
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, font: "Times New Roman" })] });
}
function makeRef(text) {
  return new Paragraph({ indent: { left: 720, hanging: 720 }, spacing: { before: 60, after: 60, line: 300 },
    children: [new TextRun({ text, size: 20, font: "Times New Roman" })] });
}
function tableWithCaption(caption, headers, rows_data, colWidths) {
  const totalW = colWidths.reduce((a,b)=>a+b,0);
  const headerRow = new TableRow({ children: headers.map((h,i) => new TableCell({
    borders, width: { size: colWidths[i], type: WidthType.DXA },
    shading: { fill: "D0D8E8", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: h, bold: true, size: 20, font: "MS Mincho" })] })]
  })) });
  const dataRows = rows_data.map(row => new TableRow({ children: row.map((cell,i) => new TableCell({
    borders, width: { size: colWidths[i], type: WidthType.DXA },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: "MS Mincho" })] })]
  })) }));
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: caption, bold: true, size: 22, font: "MS Mincho" })] }),
    new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: [headerRow, ...dataRows] }),
    sp(1)
  ];
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "MS Mincho", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "MS Mincho" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "MS Mincho" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "・",
        alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
  ]},
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 },
    margin: { top: 1418, right: 1134, bottom: 1418, left: 1134 } } },
  children: [
    // TITLE
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 },
      children: [new TextRun({ text: "日英の中間構文対照研究：事象構造、否定、および左周辺部による認可条件の再構築", bold: true, size: 32, font: "MS Mincho" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 },
      children: [new TextRun({ text: "A Contrastive Study of English and Japanese Middle Constructions: Reconstructing Licensing Conditions via Event Structure, Negation, and the Left Periphery", bold: true, size: 22, font: "Times New Roman" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: "大津 龍生　筑波大学大学院 人文社会科学研究群", size: 22, font: "MS Mincho" })] }),
    sp(2),
    // ABSTRACT
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: "要旨", bold: true, size: 24, font: "MS Mincho" })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { left: 360, right: 360 },
      spacing: { before: 60, after: 240, line: 340 },
      children: [new TextRun({ size: 20, font: "MS Mincho", text:
        "本稿は、英語中間構文（Middle Construction: MC）と日本語中間的構文（Middle-Like Construction: MLC）の統語・意味論的非対称性を、形式的生成文法の枠組みから対照的に分析することを目的とする。英語MCは、内項の主語化、付加詞の義務性、および事象項の抑制によって特徴づけられる（Alexiadou et al. 2015）。これに対し、日本語MLCは、否定辞-naiの共起が個体レベル述語（Individual-Level Predicate: ILP）読みを安定的に認可するという、英語に観察されない非対称性を示す。本稿では、この現象を捉えるために「中間構文における否定認可条件（Negation Licensing Condition for Middles: NLC-M）」を提案する。NLC-Mにおいて、-naiはDe Morgan変換を通じて事象構造からTELIC素性を消去し（Telicity Erasure）、総称演算子（GEN）の活性化を統語的に許可する。さらに、wa標示による左周辺部（Spec-TopP）への移動がHighNegPの生起を構造的に強制するという分析を展開し、英語MCとの決定的な差異が事象項抑制の統語的実現メカニズムに帰着することを主張する。" })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { left: 360, right: 360 },
      spacing: { before: 0, after: 240, line: 340 },
      children: [new TextRun({ size: 20, font: "MS Mincho",
        text: "キーワード：中間構文、否定認可条件（NLC-M）、Telicity Erasure、個体レベル述語、左周辺部、日英対照" })] }),
    sp(1),
    // 1
    h1("1. はじめに"),
    body("言語類型論における中間構文（Middle Construction: MC）は、形式上は能動態を取りながら意味上は対象の属性（Property）を記述するという、受動態とは独立したカテゴリーとして広く認識されてきた（Kemmer 1993; Lekakou 2005; Alexiadou et al. 2015）。英語の典型例 (1a) は、「このシャツが洗われた」という事象の成立ではなく、「このシャツは洗いやすい」という対象の恒常的属性を述べる。"),
    sp(1),
    example("1", "a.  This shirt washes easily.", null, "このシャツは簡単に洗える。（属性読み）"),
    sp(0), example("", "b.  この本は読める。", null, "（属性・可能読みの競合）"),
    sp(0), example("", "c.  この本は簡単に読めない。", null, "（属性読みの安定）"),
    sp(1),
    body("(1b) と (1c) の対比は、本稿の中心的な問題提起を構成する。英語では付加詞「easily」の存在が属性読みを認可するのに対し、日本語では付加詞が存在しても属性読みと事象読みの競合が生じうる。一方、否定辞-naiの共起（1c）は属性読みを顕著に安定させる。この日英非対称性は、単なる語用論的現象ではなく、両言語の事象項抑制メカニズムの根本的な違いを反映していると本稿は論じる。"),
    body("本稿の構成は以下の通りである。第2節では英語MCの先行研究を概観し、本稿が依拠する理論的枠組みを確認する。第3節では日本語MLCの形態統語的多様性を記述する。第4節でNLC-Mの形式的定式化を行う。第5節では、左周辺部とwa-NegPの相互作用を論じる。第6節では日英の非対称性を統一的に説明する。第7節は未解決問題と今後の展望に充てる。"),
    sp(1),
    // 2
    h1("2. 英語中間構文の先行研究"),
    h2("2.1 英語MCの基本特性"),
    body("英語中間構文の基本特性として、先行研究は概ね以下の四点を挙げる（Roberts 1987; Fagan 1992; Lekakou 2005）。第一に、対象の属性記述性：MCは特定の事象を記述するのではなく、主語対象の恒常的・総称的属性を述べる。第二に、付加詞の義務性：*This shirt washes. のように付加詞を欠く形式は容認されない（Yoshimura 1995/2001）。第三に、暗示的行為者の存在：行為者は非顕在化されるが、意味論的には ONE* として残留する（Lekakou 2005）。第四に、by-phraseの排除：*This shirt washes easily by John. は中間構文として不適格である。"),
    sp(1),
    h2("2.2 Lekakou (2005) の非能格分析"),
    body("Lekakou (2005) は、ゲルマン語派（英語・オランダ語・ドイツ語）の中間構文が非能格構造（unergative structure）を取ることを、（a）助動詞選択テスト、（b）過去分詞前置修飾テスト、（c）主題化テスト（ドイツ語）の三つの統語的診断から示している。"),
    body("Lekakouはこれらのデータに基づき、中間構文の暗示的行為者が「総称的不定代名詞 ONE*」として、プレ統語レベルにおいてGEN演算子によって飽和（saturate）されると分析する。ゲルマン語派は総称性を担う形態統語的標識を欠くため、ONE* はプレ統語的レベルで認可されなければならず、結果として事象レイヤーが統語論へのマッピングから省略される。また、Lekakouはドイツ語の sich を「内項の外部化を示す非項のマーカー」と定義しており、この分析は VoiceP 枠組みとの接続において示唆的である。"),
    body("本稿との理論的緊張点：Lekakouのプレ統語的派生アプローチは、HighNegPを統語的に要求するNLC-Mと方向性が異なる。この緊張の解消は第7.2節で論じる。"),
    sp(1),
    h2("2.3 Alexiadou et al. (2015) の Voice 分析"),
    body("Alexiadou, Anagnostopoulou & Schäfer (2015) は、中間構文における事象項抑制を VoiceP の内部操作として分析する。Voice 主要部が特殊な素性配列を持ち、事象項のみを抑制しつつ内項を主語位置に外部化する操作を行う。この分析は、日本語の機能範疇がどのような素性を持つかを検討する際の比較基盤を提供する。"),
    sp(1),
    // 3
    h1("3. 日本語中間的構文の概観"),
    h2("3.1 形態論的多様性"),
    body("日本語には英語のような単一の「中間動詞」語彙的範疇は存在せず、以下の複数の形式が中間的解釈を担う（劉 2010; Taguchi & Niinuma 2009; Cheon 2012）。"),
    sp(1),
    ...tableWithCaption("表1：日本語MLCの形態的形式",
      ["形式", "例", "特性"],
      [["-yasui/-nikui形", "この本は読みやすい", "形容詞化、評価的意味内包"],
       ["可能形式(-e-/-rareru)", "この肉はすぐ焼ける", "本質的可能性の表示"],
       ["自他対応自動詞+-te iru", "インテルが入ってる", "結果状態の属性化（劉 2010）"],
       ["-nai共起形", "この本は簡単に読めない", "ILP読みの安定化（NLC-M）"]],
      [2200, 3600, 3200]),
    h2("3.2 統語的主語性をめぐる論争"),
    body("Taguchi & Niinuma (2009) は、日本語MLCにおけるガ格名詞句が統語的主語でない可能性を、再帰代名詞「自分」の束縛テスト、「ながら」節のコントロールテスト、主語敬語テストの三種によって示している。これら三テストにおいて、表面上の主語に見えるガ格名詞句は主語として振る舞わず、非顕在的行為者 pro が主語性を保持する。この観察に基づき、Taguchi & Niinuma は日本語を「非移動型（nonmovement）」の中間言語と位置づける。本稿はこの主張を参照するが、pro の与格分析については独立した証拠を欠くため、第7節で問題として留保する。"),
    sp(1),
    h2("3.3 法副詞との共起制約"),
    body("Cheon (2012) は、日本語MLCと共起可能な法副詞の分布が総称性（Genericity）との適合性によって決定されることを示す。普遍的確信を表す「必ず」「絶対に」はMLCと共起可能だが、一時的推量を表す「きっと」「おそらく」「多分」は共起不可である。この観察は、MLCが総称文であることを傍証する。"),
    sp(1),
    h2("3.4 劉（2010）のアスペクト型MLC"),
    body("劉（2010）は「インテル、入ってる」型構文を「標識なし中間態」として分析し、-te iru形式が結果状態を主語の属性として呈示する機能を担うと論じる。この形式は付加詞を必要とせず、本稿のNLC-Mが対象とする-nai共起型とは区別されるべき独立したMLC類型を構成する。"),
    sp(1),
    // 4
    h1("4. 理論的枠組みと NLC-M の提案"),
    h2("4.1 基本的前提"),
    body("本稿は以下の理論的枠組みを採用する。（a）分散形態論（Halle & Marantz 1993）：形態論的操作は統語構造に形態素が後から挿入される。（b）Rizzi (1997) のSplit-CP：左周辺部はForceP > TopP > FocP > FinPに機能的に分裂する。（c）GEN演算子（Chierchia 1995）：総称文はGEN演算子によって全称命題を導出する。（d）ILP/SLPの区別（Kratzer 1995）：ILPは対象の恒常的属性を、SLPは一時的状態を表す。"),
    sp(1),
    h2("4.2 事象構造と Telicity Erasure"),
    body("日本語の動詞句は一般に [Action Tier: ACT(x) | Change Tier: BECOME(y)] という並列事象構造を持つ（cf. Kageyama 2006）。中間的解釈の成立には Change Tier の「テリック的変化」の抑制が必要である。本稿ではこの操作を Telicity Erasure と呼び、否定辞-naiとの相互作用をDe Morgan変換として形式化する。"),
    sp(1),
    formula("(2)  ¬∃e[POSS(e) ∧ TELIC(e)]  ≡  ∀e[¬POSS(e) ∨ ATELIC(e)]"),
    sp(1),
    body("（2）の左辺は「テリックな事象 e が成立可能である」ことの否定を表す。De Morgan変換によって右辺の全称命題が導出され、この全称命題がGEN演算子のスコープと合致することでILP読みが派生される。"),
    todo("De Morgan変換がGEN活性化の十分条件か必要条件かを確定すること。Chierchia (1995) の総称演算子活性化条件を精読し、逆方向の含意関係（GEN活性化が¬∃eを要求するか）を論証すること。"),
    sp(1),
    h2("4.3 NLC-Mの定式化"),
    new Paragraph({ indent: { left: 360, right: 360 }, spacing: { before: 120, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" } },
      children: [new TextRun({ text: "【NLC-M: Negation Licensing Condition for Middles】", bold: true, size: 22, font: "MS Mincho" })] }),
    new Paragraph({ indent: { left: 360, right: 360 }, spacing: { before: 0, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "2E5FAB" } },
      children: [new TextRun({ size: 22, font: "MS Mincho",
        text: "日本語MLCにおいてILP読みは、HighNegP（否定辞-naiを持つ）の統語的存在を認可条件とする。-naiはDe Morgan変換を通じて事象構造のTELIC素性を消去し（Telicity Erasure）、GEN演算子の活性化を許可する。これによりILP述語への派生が達成される。" })] }),
    sp(1),
    body("NLC-Mの予測：（i）-naiを持つ日本語MLCはILP読みを安定的に許す。（ii）-naiを持たない肯定形の日本語MLCはILP読みとSLP読みが競合する。（iii）英語MCは-naiに相当する形態論的要件を持たず、VoiceP内の操作のみでILP読みを派生する。"),
    todo("予測（ii）を実証する容認性判断データ（複数話者、文脈統制）を取得すること。「この本は読める」「この本は簡単に読める」「この本は簡単に読めない」の三者間の容認性評定の差異がNLC-Mの実証的証拠となる。"),
    sp(1),
    // 5
    h1("5. 左周辺部、wa標示、および High Negation"),
    h2("5.1 wa標示とTopPへの移動"),
    body("Rizzi (1997) のSplit-CP分析に基づき、wa標示された名詞句は Spec-TopP へ移動していると分析される。Heycock (1993) はILP述語が話題化環境を要求すると論じており、wa/ga交替がMLCの解釈型に影響することが予測される。"),
    sp(1),
    example("3", "a.  この本はよく売れる。", null, "（wa標示、ILP読み可能）"),
    sp(0), example("", "b.  この本がよく売れる。", null, "（ga標示、事象読み優先）"),
    sp(1),
    body("本稿は、wa標示が Spec-TopP 移動を引き起こし、この移動がHighNegPの存在を構造的に要求するという連鎖として（3a）対（3b）の対比を分析する。"),
    todo("wa/ga交替による解釈変化について統制された容認性実験データを提示すること。またwaがForceP・FocPとも関連しうるという議論（cf. Kuroda 1992）との整合を図ること。"),
    sp(1),
    h2("5.2 High Negation vs Low Negation の統語的区別"),
    body("NLC-MはHighNegPの存在のみがGEN活性化のトリガーとなると主張する。High vs. Low Negationを経験的に区別する診断として、（A）副詞スコープテスト、（B）数量詞スコープテスト、（C）付加副詞との語順テストの三つが候補として挙げられる。"),
    todo("これら三診断を体系的に適用し、日本語MLCでHighNegとLowNegの区別が実際に観察されるかを検証すること（Task 4）。この検証なしにはNLC-MのHighNegP仮定の経験的根拠が不在となる。"),
    sp(1),
    // 6
    h1("6. 日英中間構文の非対称性の説明"),
    h2("6.1 事象項抑制メカニズムの差異"),
    ...tableWithCaption("表2：英語MCと日本語MLCの事象項抑制メカニズム対照",
      ["特性", "英語MC", "日本語MLC（-nai型）"],
      [["抑制の場", "VoiceP内（統語的）", "HighNegP経由（統語的）"],
       ["形態論的標識", "不要", "必要（-nai）"],
       ["GEN活性化", "VoiceH操作", "De Morgan変換（NLC-M）"],
       ["ILP読みの安定性", "付加詞依存", "-nai共起で安定"],
       ["by-phrase", "排除", "によって：属性読みを破壊"]],
      [2200, 3000, 3800]),
    h2("6.2 心理動詞・知覚動詞の日英非対称性"),
    example("4", "a.  #Birthdays forget easily.", null, "（非文：英語での心理動詞MC）"),
    sp(0), example("", "b.  誕生日は忘れやすい。", null, "（容認：日本語での心理動詞MLC）"),
    sp(1),
    body("NLC-Mの枠組みでは、英語でVoiceHの素性と心理動詞の外部項（Experiencer）が非互換であるのに対し、日本語では-naiによるTelicity Erasureが事象構造レベルで作用し、動詞クラスに依存しない広範な適用が可能になることでこの非対称性を説明する。"),
    todo("英語での心理動詞MC不可の統語的説明をAlexiadou et al. (2015) の枠組みで根拠づけること。また日本語で全ての心理動詞が-naiと共起してMLC読みを得るわけではないはずであり、対照データによる境界事例の分析が必要。"),
    sp(1),
    h2("6.3 競合分析への対応"),
    body("最も直接的な競合分析として「事象項の抑制のみでILP読みが生成され、否定は不要」という立場が考えられる。これに対し本稿は、ILP読みの「可能性」と「安定性」を区別する。事象項抑制のみの分析は-naiなしでもILP読みが文脈次第で可能なことを説明できるが、-naiがILP読みを「安定化」する現象は説明できない。NLC-Mは-naiを義務的要件としてではなく、ILP読み安定化の十分条件として位置づける。"),
    sp(1),
    // 7
    h1("7. 未解決問題と今後の展望"),
    h2("7.1 GenP投射の独立動機付け"),
    body("NLC-MはGEN演算子の統語的投射を前提とするが、GenPという独立した機能投射の統語的証拠は現状では不十分である。Chierchia (1995) においてGENが真に統語的演算子か、LFレベルでのみ作用するかを確定することが必要である。"),
    todo("Chierchia (1995) 第3章のGEN導入条件を精読し、GenPがTPより高位に投射されるという主張の統語的証拠を独立に構築すること。"),
    sp(1),
    h2("7.2 Lekakou (2005) との理論的整合性"),
    body("Lekakouの非能格分析（プレ統語的派生）とNLC-Mの統語的派生アプローチの理論的緊張を解消するには、（a）日本語MLCが非対格構造を持つことを独立に証明しLekakouの適用外であることを示すか、（b）Lekakouのプレ統語的派生を「特殊素性を持つVOICEhの選択」という統語的操作に翻訳し直すか、いずれかが必要である。"),
    todo("Miyagawa (1989) の浮遊数量詞テストを日本語MLCに適用し、非対格性の統語的証拠を取得すること（Task 5）。"),
    sp(1),
    h2("7.3 Obligatory Adjunct問題"),
    body("様態副詞を「義務的付加詞」と呼ぶことはadjunctの定義（Chomsky 1986, 1995: 任意要素）と矛盾する。代替案として、（a）様態副詞を補部または指定部として再分析する、または（b）副詞共起要件を統語論ではなく意味論的インターフェース条件として処理し「属性命題としての情報価値保証のために様態情報が意味論的に必要」と定式化することが考えられる。"),
    todo("上記二案のどちらかを選択し論証すること。第二案採用の場合、Chierchia (1995) またはKratzer (1995) の意味論的枠組みでの形式化を示すこと。"),
    sp(1),
    h2("7.4 HTA条件と目的語指向性の非対称性"),
    body("英語MCでは主語のみが中間化可能なのに対し、日本語-yasui/-nikui形では目的語位置の名詞句が主語化しやすい（Teramura 1982）。本稿ではこれを「最高位主題的引数条件（Highest Thematic Argument Condition: HTA条件）」として記述するが、形式的導出は今後の課題として留保する。"),
    sp(1),
    // 8
    h1("8. 結語"),
    body("本稿は、日英の中間構文における否定の役割の非対称性を出発点に、日本語MLCにおけるILP読みの認可条件としてNLC-Mを提案した。NLC-Mは、（i）-naiによるTelicity Erasure、（ii）De Morgan変換を通じたGEN活性化、（iii）Split-CP内でのHighNegPの投射位置、という三層の理論的主張から構成される。現時点では実証的・理論的補強を要する問題が複数残存するが（第7節参照）、これらの課題を解決することでNLC-Mは日英中間構文の類型論的非対称性を統一的に説明する形式理論として整備されうる。"),
    sp(2),
    // REFERENCES
    h1("参考文献"),
    makeRef("Alexiadou, A., Anagnostopoulou, E., & Schäfer, F. (2015). External Arguments in Transitivity Alternations: A Layered Structure. Oxford: Oxford University Press."),
    makeRef("Cheon, H.-J. (2012). On the syntactic restriction between modal adverb and middle construction in Japanese. 日本硏究, 33, 59–80."),
    makeRef("Chierchia, G. (1995). Individual-level predicates as inherent generics. In G. Carlson & F. J. Pelletier (Eds.), The Generic Book (pp. 176–223). Chicago: University of Chicago Press."),
    makeRef("Chomsky, N. (1986). Barriers. Cambridge, MA: MIT Press."),
    makeRef("Chomsky, N. (1995). The Minimalist Program. Cambridge, MA: MIT Press."),
    makeRef("Fagan, S. M. B. (1992). The Syntax and Semantics of Middle Constructions. Cambridge: Cambridge University Press."),
    makeRef("Halle, M., & Marantz, A. (1993). Distributed Morphology and the pieces of inflection. In K. Hale & S. J. Keyser (Eds.), The View from Building 20 (pp. 111–176). Cambridge, MA: MIT Press."),
    makeRef("Heycock, C. (1993). Syntactic predication in Japanese. Journal of East Asian Linguistics, 2(3), 167–211."),
    makeRef("Kageyama, T. (2006). Property description as a voice phenomenon. In M. Everaert et al. (Eds.), Dynamics of Language Acquisition (pp. 85–114). Amsterdam: John Benjamins."),
    makeRef("Kemmer, S. (1993). The Middle Voice. Amsterdam: John Benjamins."),
    makeRef("Kratzer, A. (1995). Stage-level and individual-level predicates. In G. Carlson & F. J. Pelletier (Eds.), The Generic Book (pp. 125–175). Chicago: University of Chicago Press."),
    makeRef("Kuroda, S.-Y. (1992). Japanese Syntax and Semantics. Dordrecht: Kluwer."),
    makeRef("Lekakou, M. (2005). In the middle, somewhat elevated: The semantics of middles and its crosslinguistic realization. PhD dissertation, University College London."),
    makeRef("Luk, Z. P.-S. (2022). The relationship between verb meaning and argument realization: What we learn from the processing of agent-implying intransitive verbs in Japanese. Frontiers in Psychology, 13, 928649."),
    makeRef("Miyagawa, S. (1989). Structure and Case Marking in Japanese. San Diego: Academic Press."),
    makeRef("Pardeshi, P. (2008). No smoke without fire: Invisible agent constructions in South Asian languages. In R. Singh (Ed.), Annual Review of South Asian Languages and Linguistics (pp. 63–82). Berlin: Mouton de Gruyter."),
    makeRef("Pollock, J.-Y. (1989). Verb movement, Universal Grammar, and the structure of IP. Linguistic Inquiry, 20(3), 365–424."),
    makeRef("Rizzi, L. (1997). The fine structure of the left periphery. In L. Haegeman (Ed.), Elements of Grammar (pp. 281–337). Dordrecht: Kluwer."),
    makeRef("Roberts, I. (1987). The Representation of Implicit and Dethematized Subjects. Dordrecht: Foris."),
    makeRef("Taguchi, S., & Niinuma, F. (2009). On the subject of the Japanese middle and tough constructions. In Current Issues in Unity and Diversity of Languages: CIL 18 Selected Papers (pp. 1875–1886). Seoul: The Linguistic Society of Korea."),
    makeRef("Teramura, H. (1982). 日本語の文法（上）. Tokyo: Kokuritsu Kokugo Kenkyujo."),
    makeRef("Yoshimura, K. (1995). Licensing of the middle construction. Master's thesis, University of Oregon."),
    makeRef("劉建 (2010). 日本語の中間態再考：「インテル、入ってる」型を中心に. 筑波日本語研究, 15, 1–30."),
  ]}]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/NLC-M_paper_draft.docx', buf);
  console.log('Done');
});
