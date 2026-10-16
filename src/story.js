// Story graph — text and choices are unchanged from the original text version of the game.
export const story = {
opening:{chapter:1,chapterName:'The Letter',scene:1,title:'A Letter in the Rain',art:'city',text:`Rain turns the rooftops silver. From Ren's window, the old clock tower rises above the city like a dark finger pointing at the red moon.\n\nA folded letter lies on the windowsill. The handwriting is unmistakably Ren's, though the memory of writing it is gone.\n\n“WHEN THE MOON TURNS RED, DO NOT OPEN THE TOWER.”\n\nThree knocks sound at the door. Someone is waiting outside.`,choices:[
{label:'Open the door and speak honestly.',next:'miraDoor',effects:{trust:1},log:'Ren chose honesty with the visitor.'},
{label:'Hide the letter before opening the door.',next:'miraGuarded',effects:{},log:'Ren kept the letter secret.'},
{label:'Inspect the letter for hidden marks first.',next:'letterInspect',effects:{clue:'Silver symbol'},log:'A silver symbol was found on the letter.'}]},
miraDoor:{chapter:1,chapterName:'The Letter',scene:2,title:'The Stranger at the Door',art:'city',text:`A young librarian stands beneath a dark umbrella. “I'm Mira. I knew someone would find that letter tonight.”\n\nShe studies Ren's face with a sadness that feels older than the rain.\n\n“I can help you understand it,” she says. “But I need to know if you're ready to hear something you may not like.”`,choices:[
{label:'Tell Mira everything about the letter.',next:'libraryIntro',effects:{trust:1},log:'Ren trusted Mira with the letter.'},
{label:'Ask what she knows about the tower.',next:'towerRumor',effects:{clue:'Tower warning'},log:'Ren asked about the tower.'},
{label:'Offer to help a lost child calling nearby.',next:'lostChild',effects:{compassion:1},log:'Ren helped a lost child before continuing.'}]},
miraGuarded:{chapter:1,chapterName:'The Letter',scene:2,title:'A Careful Conversation',art:'city',text:`Mira introduces herself as a librarian, but her eyes keep drifting toward Ren's closed hand.\n\n“People are forgetting things,” she says. “Names, faces, entire years. The library keeps what the city loses.”\n\nShe doesn't ask what Ren is hiding. Somehow, that makes the silence heavier.`,choices:[
{label:'Show Mira the letter after all.',next:'libraryIntro',effects:{trust:1},log:'Ren decided to show Mira the letter.'},
{label:'Ask her to prove the library exists.',next:'libraryIntro',effects:{clue:'Library seal'},log:'Ren asked Mira for proof.'},
{label:'Leave and search the street alone.',next:'lostChild',effects:{},log:'Ren began investigating alone.'}]},
letterInspect:{chapter:1,chapterName:'The Letter',scene:2,title:'The Silver Mark',art:'memory',text:`The paper feels warm despite the cold rain. Under the final line, a symbol glimmers: a crescent crossed by a tiny clock hand.\n\nWhen Ren touches it, a memory flashes — a train platform, a voice saying “not everyone should remember.” Then it vanishes.\n\nThe knocks at the door come again.`,choices:[
{label:'Open the door and show Mira the symbol.',next:'libraryIntro',effects:{trust:1},log:'Mira saw the silver symbol.'},
{label:'Keep the symbol secret and follow the streetlights.',next:'lostChild',effects:{clue:'Silver symbol'},log:'Ren kept the symbol secret.'}]},
lostChild:{chapter:1,chapterName:'The Letter',scene:3,title:'The Child Who Forgot Home',art:'city',text:`At the corner, a child stands beneath a broken streetlamp. They know their own name but cannot remember where home is.\n\nRen kneels beside them. For a moment, the city feels less like a mystery and more like a place full of people who need help.\n\nMira arrives and guides the child toward a warm shop. “The library,” she tells Ren, “is where we should go next.”`,choices:[
{label:'Ask Mira to explain the missing memories.',next:'libraryIntro',effects:{trust:1},log:'Ren continued to the library with Mira.'},
{label:'Promise to help the child find their family later.',next:'libraryIntro',effects:{compassion:1},log:'Ren promised to return for the child.'}]},
towerRumor:{chapter:1,chapterName:'The Letter',scene:3,title:"The Tower's Rule",art:'tower',text:`“The tower is older than the city,” Mira says. “The Clockmaker says it protects us. My records say it takes something in return.”\n\nA bell rings once, though the tower clock has no hands. Several people on the street stop walking, then continue as if nothing happened.\n\nMira lowers her voice. “The library has the records. Come with me.”`,choices:[
{label:'Go to the library with Mira.',next:'libraryIntro',effects:{trust:1},log:'Ren followed Mira to the library.'},
{label:"Write down the bell's time and sound.",next:'libraryIntro',effects:{clue:'Handless bell'},log:'Ren recorded the tower bell.'}]},
libraryIntro:{chapter:2,chapterName:'The Library of Unwritten Names',scene:1,title:'A Library Beneath the Rain',art:'library',text:`The library hides beneath a glass-roofed arcade. Inside, thousands of books hover in slow circles, their titles fading and returning like reflections on water.\n\nMira leads Ren to a shelf marked with the silver crescent. Most of the books are blank. One bears Ren's name — and a date from ten years ago.\n\n“You were here before,” Mira whispers. “You asked us to hide something.”`,choices:[
{label:'Open the book bearing Ren’s name.',next:'renBook',effects:{clue:'Ren’s archive'},log:'Ren opened their own archive.'},
{label:'Ask Mira why she never told Ren.',next:'miraTruth',effects:{trust:1},log:'Ren confronted Mira about the past.'},
{label:'Search for a symbol matching the letter.',next:'symbolPuzzle',effects:{clue:'Archive symbol'},log:'Ren searched the archive for the symbol.'}]},
renBook:{chapter:2,chapterName:'The Library of Unwritten Names',scene:2,title:"The Memory That Wouldn't Stay",art:'library',text:`The book opens to a drawing of the tower and a small train. The writing beneath it changes as Ren reads.\n\n“I chose to forget the night the sky broke.”\n\nA second sentence appears: “If I remember everything, the city will remember too.”\n\nRen closes the book. The words remain behind their eyes.`,choices:[
{label:'Tell Mira what the book said.',next:'miraTruth',effects:{trust:1,clue:'Ren’s warning'},log:'Ren shared the book’s warning.'},
{label:'Copy the changing sentence into the journal.',next:'symbolPuzzle',effects:{clue:'Changing sentence'},log:'Ren copied the sentence.'}]},
miraTruth:{chapter:2,chapterName:'The Library of Unwritten Names',scene:2,title:"Mira's Missing Page",art:'library',text:`Mira admits she was a child when Ren first visited. “You came with someone who wanted the city to forget a terrible event. You said it was the only way to keep everyone safe.”\n\n“Who was with me?” Ren asks.\n\nMira looks toward a locked cabinet. “The records were taken to the last train. If you want the rest, we need to go there.”`,choices:[
{label:'Trust Mira and head for the station.',next:'trainStation',effects:{trust:1},log:'Ren trusted Mira’s account.'},
{label:'Ask to inspect the locked cabinet first.',next:'symbolPuzzle',effects:{clue:'Locked cabinet'},log:'Ren inspected the archive cabinet.'}]},
symbolPuzzle:{chapter:2,chapterName:'The Library of Unwritten Names',scene:3,title:'The Crescent Cipher',art:'library',text:`Three brass discs sit on a desk: a crescent, a clock hand, and a star. A note says, “Time points to what the moon conceals.”\n\nRen turns the discs until the clock hand points toward the crescent. A hidden drawer opens, revealing a ticket stamped with tonight's date.\n\nThe last train is waiting at the abandoned station.`,choices:[
{label:'Take the ticket and leave for the station.',next:'trainStation',effects:{clue:'Last train ticket'},log:'Ren solved the crescent cipher.'},
{label:'Record the cipher before leaving.',next:'trainStation',effects:{clue:'Crescent cipher'},log:'Ren recorded the cipher solution.'}]},
trainStation:{chapter:3,chapterName:'The Last Train',scene:1,title:'Platform Zero',art:'train',text:`The station has no sign and no tracks on any city map. A train waits beneath a canopy of dim blue lamps. Its windows show different weather: snow, summer sunlight, a night sky filled with unfamiliar stars.\n\nThree passengers sit inside. Each claims to remember the same night — and each tells a different story.\n\nThe conductor holds out a hand. “One question before we depart.”`,choices:[
{label:'Ask the conductor what the train carries.',next:'passengers',effects:{clue:'Train carries memories'},log:'Ren questioned the conductor.'},
{label:'Ask the passengers about the tower.',next:'passengers',effects:{trust:1},log:'Ren asked the passengers about the tower.'},
{label:'Study the windows for clues.',next:'windowMemory',effects:{clue:'Window visions'},log:'Ren studied the strange train windows.'}]},
windowMemory:{chapter:3,chapterName:'The Last Train',scene:2,title:'Windows into Yesterday',art:'train',text:`One window shows a crowded festival beneath a bright moon. Another shows the same square empty and covered in ash. In the third, Ren stands beside a masked figure holding a clock with no hands.\n\nThe visions overlap. A name appears on the glass, then fades before Ren can read it.\n\nSomeone on the train is hiding a memory — perhaps to protect Ren, perhaps to protect themselves.`,choices:[
{label:'Ask the passengers what they are hiding.',next:'passengers',effects:{clue:'Masked figure'},log:'Ren asked about the masked figure.'},
{label:'Follow the name etched into the window.',next:'passengers',effects:{clue:'Fading name'},log:'Ren recorded the fading name.'}]},
passengers:{chapter:3,chapterName:'The Last Train',scene:3,title:'Three Versions of One Night',art:'train',text:`The first passenger remembers a celebration. The second remembers a warning siren. The third remembers Ren standing at the tower door and choosing to close it.\n\nTheir stories cannot all be true — unless each person remembers only a piece.\n\nMira finds a ticket hidden beneath a seat. On the back, someone has written: “The Clockmaker did not start the forgetting. He inherited it.”`,choices:[
{label:'Keep the ticket and ask the Clockmaker directly.',next:'clockmaker',effects:{clue:'Inherited forgetting'},log:'Ren kept the ticket.'},
{label:'Compare all three accounts in the journal.',next:'clockmaker',effects:{clue:'Contradictory accounts'},log:'Ren compared the passengers’ accounts.'}]},
clockmaker:{chapter:4,chapterName:'The Clock Without Hands',scene:1,title:'The Keeper of the Tower',art:'tower',text:`At the tower gate, the Clockmaker waits with a lantern. His mask is made from the face of a clock, its hands removed.\n\n“I maintain the boundary,” he says. “The city asked to be protected from one memory. Every generation has renewed that choice.”\n\n“Who made the first choice?” Ren asks.\n\nThe Clockmaker unlocks the gate. “You did — or the person you were before you forgot.”`,choices:[
{label:'Enter the tower and demand the full truth.',next:'towerHeart',effects:{clue:'First choice'},log:'Ren entered the tower.'},
{label:'Ask the Clockmaker to show the original record.',next:'originalRecord',effects:{trust:1,clue:'Original record'},log:'Ren asked for the original record.'},
{label:'Refuse to trust him and inspect the mechanism.',next:'towerHeart',effects:{clue:'Clock mechanism'},log:'Ren inspected the tower mechanism.'}]},
originalRecord:{chapter:4,chapterName:'The Clock Without Hands',scene:2,title:'The Original Record',art:'memory',text:`The original record describes a disaster: during the crimson eclipse, a machine beneath the tower amplified a painful memory until the entire city experienced it at once.\n\nRen's younger self helped create the memory barrier. The Clockmaker maintained it, but the barrier has begun to fail.\n\nThe record ends with a question in Ren's handwriting: “Can we learn to remember without letting the past control us?”`,choices:[
{label:"Take the record to the tower's heart.",next:'towerHeart',effects:{clue:'Barrier origin'},log:'Ren carried the original record.'},
{label:'Ask Mira what she wants the city to remember.',next:'towerHeart',effects:{trust:1},log:'Ren asked Mira what truth matters most.'}]},
towerHeart:{chapter:4,chapterName:'The Clock Without Hands',scene:3,title:'The Heart of the Clock',art:'tower',text:`At the centre of the tower, a glass sphere contains thousands of tiny lights. Each light is a memory held back from the city.\n\nThe machine is failing. If it breaks without guidance, memories may return all at once. If it remains untouched, the city will continue forgetting.\n\nMira stands beside Ren. “We can choose what happens next. But we must choose together.”`,choices:[
{label:'Study the mechanism and look for a third option.',next:'finalDecision',effects:{clue:'A third way'},log:'Ren searched for an alternative.'},
{label:'Ask Mira and the Clockmaker to explain the risks.',next:'finalDecision',effects:{trust:1},log:'Ren listened to both sides.'},
{label:'Think of the people who have already forgotten.',next:'finalDecision',effects:{compassion:1},log:'Ren put the city’s people first.'}]},
finalDecision:{chapter:5,chapterName:'The Moon Remembers',scene:1,title:'The Choice Beneath the Moon',art:'memory',text:`The sphere dims. Beyond the tower windows, the red moon begins to pale.\n\nRen understands the three paths. Restore the memories and let the city face its history. Keep the barrier and preserve the peace people know. Or, if enough evidence has been gathered, rebuild the machine so memories return gradually, with the choice to face them.\n\nThe final decision belongs to Ren.`,choices:[
{label:'Restore every memory, whatever the consequences.',next:'endingRestore',effects:{},log:'Ren chose to restore the city’s memories.'},
{label:'Keep the barrier and protect the present.',next:'endingSilence',effects:{},log:'Ren chose to preserve the barrier.'},
{label:'Build a new path for memories to return safely.',next:'endingNew',requires:{clues:3,trust:2},effects:{},log:'Ren chose a new way forward.'},
{label:'Choose the most compassionate path for the city.',next:'endingCompassion',requires:{compassion:2},effects:{},log:'Ren chose a compassionate future.'}]},
endingRestore:{chapter:5,chapterName:'The Moon Remembers',scene:2,title:'Ending: The Restored Sky',art:'memory',ending:true,text:`Ren opens the sphere. Light rushes across the city — not as a weapon, but as a sunrise that arrives from within.\n\nPeople remember the promises they broke, the friends they lost, and the reasons they once chose silence. Some weep. Some embrace. Some need time before they can speak.\n\nThe city does not become perfect. It becomes honest. Ren watches the red moon fade into silver and understands that remembering is not the same as being trapped in the past.`,choices:[]},
endingSilence:{chapter:5,chapterName:'The Moon Remembers',scene:2,title:'Ending: The Gentle Silence',art:'city',ending:true,text:`Ren closes the sphere. The machine settles into a quiet rhythm, and the red moon dims behind a veil of cloud.\n\nThe city wakes with its familiar gaps. Some people remain safe from memories they are not ready to face. Others continue searching for the names and feelings that slip away each night.\n\nRen keeps the original record and leaves the tower unlocked. Perhaps one day the city will choose to remember. For now, the silence is gentle — but it is still silence.`,choices:[]},
endingNew:{chapter:5,chapterName:'The Moon Remembers',scene:2,title:'Ending: A New Memory',art:'memory',ending:true,text:`Ren aligns the crescent, the clock hand, and the star. The mechanism changes its rhythm. Instead of forcing memories back or hiding them away, it offers each person a choice: open a memory when ready, or leave it closed for now.\n\nThe city fills with small lights, one at a time. Mira opens a book that has been blank for years. The Clockmaker removes his mask. Luma rises into the sky, becoming a new constellation.\n\nRen has not erased the past. Ren has given the city a way to meet it.`,choices:[]},
endingCompassion:{chapter:5,chapterName:'The Moon Remembers',scene:2,title:'Ending: The Light We Keep',art:'memory',ending:true,text:`Ren remembers the child at the streetlamp, the frightened passengers, and Mira's careful honesty. The machine is adjusted to release only the memories people choose to face, one small light at a time.\n\nNot every secret is solved. Not every wound closes. But the city begins to care for the people behind its forgotten names.\n\nMira places the letter in the archive, not as a warning, but as proof that even a lost memory can become the beginning of a kinder choice.`,choices:[]}
};

// Which place in the 3D city each scene happens at.
export const sceneZone = {
  opening:'home', miraDoor:'home', miraGuarded:'home', letterInspect:'home',
  lostChild:'street', towerRumor:'street',
  libraryIntro:'library', renBook:'library', miraTruth:'library', symbolPuzzle:'library',
  trainStation:'station', windowMemory:'station', passengers:'station',
  clockmaker:'tower', originalRecord:'tower', towerHeart:'tower', finalDecision:'tower',
  endingRestore:'tower', endingSilence:'tower', endingNew:'tower', endingCompassion:'tower'
};
// Scenes where Mira is present (she follows Ren from the first meeting onward).
export const miraAbsent = new Set(['opening', 'letterInspect']);

export const zoneNames = { home:"Ren's home", street:'The broken streetlamp', library:'The Library of Unwritten Names', station:'Platform Zero', tower:'The Clock Tower' };

// Forgotten-memory fragments hidden around the city (collectable orbs).
export const fragments = [
  'A paper lantern drifting up past a moon that was still silver.',
  'Someone laughing in a kitchen that no longer has a door.',
  'A train whistle: three notes, always the same three.',
  'Your own handwriting, younger and less afraid.',
  'A bell ringing with no hands to ring it.',
  'Rain on a glass roof, and a child small enough to hide under a library table.',
  'A promise to come back before the moon changed colour.',
  'A child’s name, almost remembered.',
  'The smell of warm bread from a bakery that closed overnight.',
  'A whole crowd looking up at the same sky, all at once.',
  'A key that fits no lock in the city, except one.',
  'A man in a clock-face mask, before the mask, asking if you were sure.',
  'A star with no name, drawn in chalk on a wall.',
  'The moment the sky broke, and everyone chose to look away.'
];
