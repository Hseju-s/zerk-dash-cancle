const blockTime = 1;      //Working time are within the range of 1 -> (250 - your ping).
const restrictTime = 2000;	// Makes it so you cannot dash back to back within the duration (ms).

/* Recommanded not to touch under this if you don't know what you're doing */

const Command = require('command');

module.exports = function ZerkDashCancel(dispatch) {
const command = Command(dispatch);
          
    let enabled = false;
    let skill = [
        {name : 'Cyclone',
        id : 67209964,
        offCd : 0,
        nextAttempt : 0,
        nextDash : 0},
    	{name: 'Dash',
    	id: 67159064,
    	abnormality: [400500, 400501, 400508, 400509],
    	offCd : 0,
    	duration : 0}
    ],
    me,
    count = 0;

    command.add('dc', () => {
		enabled = !enabled
		command.message(`[Tuturu] Dash Cancel : ${enabled}`);
	});


    let block = (info) => {
        dispatch.toServer('C_PRESS_SKILL', 2,{
			skill: 67129094,
			press: true,
			loc: info.loc,
			w: info.w
        });
        setTimeout(() => {
	        dispatch.toServer('C_PRESS_SKILL', 2,{
				skill: 67129094,
				press: false,
				loc: info.loc,
				w: info.w
				});
	    }, 5);
    };

    let dash = event => {
    	dispatch.toServer('C_START_SKILL', 5, {
			skill: 67159064,
			w: event.w,
			loc: event.loc,
			dest: { x: 0, y: 0, z: 0 },
			unk: true,
			moving: false,
			continue: false,
			target: { low: 0, high: 0, unsigned: true },
			unk2: false
		});
    };

    let cyclonePress = event => {
    	dispatch.toServer('C_PRESS_SKILL', 2, event);
    }

    let brain = (event) => {
    	if(event.skill === skill[0].id && event.press && Date.now() > skill[1].offCd && Date.now() > skill[0].nextDash){
			skill[0].nextAttempt = Date.now() + 500;
			dash(event);
    	}
		else if(event.skill === skill[1].id && Date.now() > skill[1].duration) {
			setTimeout(block, blockTime, event);
		}
    };

    dispatch.hook('S_LOGIN', 10, event => {
    	model = event.templateId;
        enabled = model % 100 === 4 ? true : false;
        me = event.gameId;
    }); 

    dispatch.hook('S_START_COOLTIME_SKILL', 1, event => {
        if(!enabled) return;
        let index = skill.findIndex(x => x.id === event.skill);
    	if(index != -1) skill[index].offCd = Date.now() + event.cooldown;
    	if(index === 0 && event.cooldown === 0) skill[0].nextDash = Date.now() + restrictTime;
    }); 

    dispatch.hook('C_START_SKILL', 5, {order: -10}, event => {
		if(!enabled) return;
		brain(event);
	});

	dispatch.hook('C_PRESS_SKILL', 2, {order: -10}, event => {
		if(!enabled) return;
		if(event.skill === skill[0].id && event.press && Date.now() < skill[0].nextAttempt) return false;
		brain(event);
	});

	dispatch.hook('S_ABNORMALITY_BEGIN', 2, {order: -10}, event => {
		if(!enabled) return;
		if(JSON.stringify(event.target) === JSON.stringify(me) && skill[1].abnormality.includes(event.id)){
			skill[1].duration = Date.now() + event.duration;
		}
	});

	dispatch.hook('S_ABNORMALITY_REFRESH', 1, {order: -10}, event => {
		if(!enabled) return;
		if(JSON.stringify(event.target) === JSON.stringify(me) && skill[1].abnormality.includes(event.id)){
			skill[1].duration = Date.now() + event.duration;
		}
	});
}

