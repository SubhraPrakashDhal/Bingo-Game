import { CoinChoice } from '../../../shared/types';

export class TossEngine {
  public static flipCoin(): CoinChoice {
    return Math.random() < 0.5 ? 'HEADS' : 'TAILS';
  }

  public static determineWinner(
    chooserChoice: CoinChoice,
    chooserId: string,
    otherPlayerId: string
  ): { outcome: CoinChoice; winnerId: string } {
    const outcome = this.flipCoin();
    const winnerId = chooserChoice === outcome ? chooserId : otherPlayerId;
    return { outcome, winnerId };
  }
}
