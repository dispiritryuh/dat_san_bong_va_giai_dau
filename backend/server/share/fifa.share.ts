export class FifaRankingSystem {
    public static readonly IMPORTANCE = {
        FRIENDLY: 10,             
        TOURNAMENT_GROUP: 20,     
        TOURNAMENT_KNOCKOUT: 30   
    };

    /**
     * @param eloA 
     * @param eloB 
     * @param scoreA 
     * @param importance 
     */
    public static calculate(
        eloA: number, 
        eloB: number, 
        scoreA: number, 
        importance: number = this.IMPORTANCE.FRIENDLY
    ) {
        const scoreB = 1 - scoreA;

   const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const expectedB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400));

        // elo 
   const newEloA = eloA + importance * (scoreA - expectedA);
    const newEloB = eloB + importance * (1 - scoreA - expectedB);
        return {
            teamA: {
                oldElo: eloA,
                newElo: newEloA,
                pointsChange: newEloA - eloA 
            },
            teamB: {
                oldElo: eloB,
                newElo: newEloB,
                pointsChange: newEloB - eloB
            }
        };
    }
}