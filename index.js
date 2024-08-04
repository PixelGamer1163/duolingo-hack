const fetch = require('node-fetch');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function automatedDuolingoLesson() {
  try {
    process.env.LESSONS = process.env.LESSONS ?? 1;
    process.env.LESSON_DURATION_SECONDS = process.env.LESSON_DURATION_SECONDS ?? 90; // Default to 90 seconds

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };

    const { sub } = JSON.parse(
      Buffer.from(process.env.DUOLINGO_JWT.split(".")[1], "base64").toString(),
    );

    const { fromLanguage, learningLanguage } = await fetch(
      `https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage`,
      { headers },
    ).then((response) => response.json());

    let xp = 0;
    for (let i = 0; i < process.env.LESSONS; i++) {
      console.log(`Starting lesson ${i + 1}...`);
      
      const sessionStart = new Date();
      const session = await fetch(
        "https://www.duolingo.com/2017-06-30/sessions",
        {
          body: JSON.stringify({
            challengeTypes: [
              "assist", "characterIntro", "characterMatch", "characterPuzzle", "characterSelect",
              "characterTrace", "characterWrite", "completeReverseTranslation", "definition",
              "dialogue", "extendedMatch", "extendedListenMatch", "form", "freeResponse",
              "gapFill", "judge", "listen", "listenComplete", "listenMatch", "match", "name",
              "listenComprehension", "listenIsolation", "listenSpeak", "listenTap",
              "orderTapComplete", "partialListen", "partialReverseTranslate", "patternTapComplete",
              "radioBinary", "radioImageSelect", "radioListenMatch", "radioListenRecognize",
              "radioSelect", "readComprehension", "reverseAssist", "sameDifferent", "select",
              "selectPronunciation", "selectTranscription", "svgPuzzle", "syllableTap",
              "syllableListenTap", "speak", "tapCloze", "tapClozeTable", "tapComplete",
              "tapCompleteTable", "tapDescribe", "translate", "transliterate",
              "transliterationAssist", "typeCloze", "typeClozeTable", "typeComplete",
              "typeCompleteTable", "writeComprehension",
            ],
            fromLanguage,
            isFinalLevel: false,
            isV2: true,
            juicy: true,
            learningLanguage,
            smartTipsVersion: 2,
            type: "GLOBAL_PRACTICE",
          }),
          headers,
          method: "POST",
        },
      ).then((response) => response.json());

      console.log(`Waiting for ${process.env.LESSON_DURATION_SECONDS} seconds...`);
      await sleep(process.env.LESSON_DURATION_SECONDS * 1000);

      const sessionEnd = new Date();
      const response = await fetch(
        `https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
        {
          body: JSON.stringify({
            ...session,
            heartsLeft: 0,
            startTime: sessionStart.getTime() / 1000,
            enableBonusPoints: false,
            endTime: sessionEnd.getTime() / 1000,
            failed: false,
            maxInLessonStreak: 9,
            shouldLearnThings: true,
          }),
          headers,
          method: "PUT",
        },
      ).then((response) => response.json());

      xp += response.xpGain;
      console.log(`Lesson ${i + 1} completed. Gained ${response.xpGain} XP.`);
    }

    console.log(`🎉 Total XP gained: ${xp}`);
  } catch (error) {
    console.log("❌ Something went wrong");
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
}

automatedDuolingoLesson();
