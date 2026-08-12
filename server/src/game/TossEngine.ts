import { CoinChoice } from '../../../shared/types';

export class TossEngine {
  public static flipCoin(): CoinChoice {
    return Math.random() < 0.5 ? 'HEADS' : 'TAILS';
  }

  public static determineWinner(
    hostChoice: CoinChoice,
    hostId: string,
    guestId: string
  ): { outcome: CoinChoice; winnerId: string } {
    const outcome = this.flipCoin();
    const winnerId = hostChoice === outcome ? hostId : guestId;
    return { outcome, winnerId };
  }
}
