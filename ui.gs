function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('戰報作業')
    .addItem('立即寄送戰報06', 'sent06BattleReport')
    .addItem('立即寄送戰報04', 'sent04BattleReport')
    .addSeparator()
    .addItem('解除月初卡控 — 06戰報', 'release06MonthEndHold')
    .addItem('解除月初卡控 — 04戰報', 'release04MonthEndHold')
    .addToUi();
}
