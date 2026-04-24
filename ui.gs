function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('戰報作業')
    .addItem('立即寄送戰報06', 'sent06BattleReport')
    .addItem('立即寄送戰報04', 'sent04BattleReport')
    .addToUi();
}
