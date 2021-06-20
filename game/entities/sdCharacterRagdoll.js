/*

	Class instances of which are stored at sdCharacter's _ragdoll property

	BUG: Ragdoll randomly flies and stretches on death, problem can be near SeededRandomNumberGenerator. Can be related to character's .sx and ragdoll turn addition. Because of soft bones being too far when animation stops

*/

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';

class sdCharacterRagdoll
{
	static init_class()
	{
		sdCharacterRagdoll.spring_both = 0;
		sdCharacterRagdoll.spring_min = 1;
		sdCharacterRagdoll.spring_max = 2;
		
		sdCharacterRagdoll.SeededRandomNumberGenerator = new sdWorld.SeededRandomNumberGenerator_constructor( 64372 );
	}
	
	constructor( character )
	{
		if ( character._ragdoll )
		throw new Error( 'Ragdoll already exists for sdCharacter' );
		
		this.character = character;
		character._ragdoll = this;
		
		this.last_char_hea = this.character.hea;
	
		this.bones = [];
		
		this.springs = [];
		
		this.angular_restrictors = []; // [ lineA, lineB, testBone, always_on_left:Boolean ]
		
		this.AddBone( 'torso', 13, 22, 2 );
		this.AddBone( 'spine', 13, 16, 3 );
		this.AddBone( 'chest', 13, 14, 4 );
		this.AddBone( 'neck', 13, 11, 1.5 );
		this.AddBone( 'head', 14, 7, 3, 0.5 );
		
		this.springs.push( new sdSpring( this.torso, this.chest, null, 0, 0, 0, sdCharacterRagdoll.spring_both ) );
		this.springs.push( new sdSpring( this.torso, this.neck, null, 0, 0, 0, sdCharacterRagdoll.spring_both ) );
		this.springs.push( new sdSpring( this.torso, this.spine, 'body_lower', 0, 0, 0, sdCharacterRagdoll.spring_both ) );
		
		this.springs.push( new sdSpring( this.spine, this.chest, null, 0, 0, 0, sdCharacterRagdoll.spring_both ) );
		this.springs.push( new sdSpring( this.spine, this.neck, 'body_upper', 0, 0.001, 0, sdCharacterRagdoll.spring_both ) );
		
		this.springs.push( new sdSpring( this.chest, this.neck, null, 0, 0, 0, sdCharacterRagdoll.spring_both ) );
		this.springs.push( new sdSpring( this.neck, this.head, 'head', 0, 0.002, 0, sdCharacterRagdoll.spring_both ) );
		
		this.springs.push( new sdSpring( this.torso, this.head, null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
		this.springs[ this.springs.length - 1 ].radius -= 0.7;
		
		for ( let i = 1; i <= 2; i++ )
		{
			this.AddBone( 'elbow' + i, 16, 14, 0.5 );
			this.AddBone( 'hand' + i, 22, 14, 0.5 );
			
			this.springs.push( new sdSpring( this.chest, this[ 'elbow' + i ], 'arm_upper', 0, ( i - 1.5 ) * 0.1, -Math.PI / 2, sdCharacterRagdoll.spring_both ) );
			this.springs.push( new sdSpring( this[ 'elbow' + i ], this[ 'hand' + i ], 'arm_lower', 0, ( i - 1.5 ) * 0.1 - 0.001, -Math.PI / 2, sdCharacterRagdoll.spring_both ) );
			
			// Elbows
			this.angular_restrictors.push([
				this.chest,
				this[ 'hand' + i ],
				this[ 'elbow' + i ],
				false
			]);

			// Keep minimal distance between chest and hands
			this.springs.push( new sdSpring( this.chest, this[ 'hand' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
			this.springs[ this.springs.length - 1 ].radius = 4;
			
			this.AddBone( 'knee' + i, 13, 26, 1.5 );
			this.AddBone( 'ankle' + i, 13, 30, 2 );
			this.AddBone( 'toes' + i, 15, 30, 2 );
			
			this.springs.push( new sdSpring( this.torso, this[ 'knee' + i ], 'leg_upper', 1, ( i - 1.5 ) * 0.05, 0, sdCharacterRagdoll.spring_both ) );
			this.springs.push( new sdSpring( this[ 'knee' + i ], this[ 'ankle' + i ], 'leg_lower', 1, ( i - 1.5 ) * 0.05 + 0.001, 0, sdCharacterRagdoll.spring_both ) );
			this.springs.push( new sdSpring( this[ 'ankle' + i ], this[ 'toes' + i ], 'feet', 1, ( i - 1.5 ) * 0.05 + 0.002, 0, sdCharacterRagdoll.spring_both ) );
			
			// Knees
			this.angular_restrictors.push([
				this.torso,
				this[ 'ankle' + i ],
				this[ 'knee' + i ],
				true
			]);
			
			// Upper leg
			this.angular_restrictors.push([
				this.spine,
				this[ 'knee' + i ],
				this.torso,
				false
			]);
			
			// Keep feet on correct side
			this.angular_restrictors.push([
				this[ 'knee' + i ],
				this[ 'ankle' + i ],
				this[ 'toes' + i ],
				true
			]);
			
			// Keep minimal distance between torso and ankles
			this.springs.push( new sdSpring( this.torso, this[ 'ankle' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
			this.springs[ this.springs.length - 1 ].radius = 6;
			
			// Keep minimal distance between knees and spine
			this.springs.push( new sdSpring( this.spine, this[ 'knee' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
			this.springs[ this.springs.length - 1 ].radius = 6;
			
			// Keep minimal distance between neck and ankles
			this.springs.push( new sdSpring( this.neck, this[ 'ankle' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
			this.springs[ this.springs.length - 1 ].radius = 13;
			
			// Limit toes movement slightly
			this.springs.push( new sdSpring( this[ 'knee' + i ], this[ 'toes' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_min ) );
			this.springs[ this.springs.length - 1 ].radius -= 0.6;
			// Limit toes movement slightly [ 2 ]
			this.springs.push( new sdSpring( this[ 'knee' + i ], this[ 'toes' + i ], null, 0, 0, 0, sdCharacterRagdoll.spring_max ) );
			this.springs[ this.springs.length - 1 ].radius += 0.6;
		}
		
		this.springs.sort( (a,b)=>a.z_offset-b.z_offset );
		
		this._stress = 0;
		
		this.ever_updated = false;
		//this.AliveUpdate();
	}
	MoveBone( bone, x, y )
	{
		x -= 16;
		y -= 16;
		x *= this.character._side;
		x += this.character.x;
		y += this.character.y;
		
		//if ( this.character.pain_anim <= 0 )
		{
			//bone.sx = 0;
			//bone.sy = 0;
			this.MoveBoneAbsolute( bone, x, y );
		}
		/*else
		this.MoveBoneAbsolute( bone, x, y, 0.5 );*/
	}
	MoveBoneRelative( bone, x, y )
	{
		//if ( this.character.pain_anim <= 0 )
		{
			//bone.sx = 0;
			//bone.sy = 0;
			this.MoveBoneAbsolute( bone, x, y );
		}
		/*else
		this.MoveBoneAbsolute( bone, x, y, 0.5 );*/
	}
	MoveBoneAbsolute( bone, x, y )
	{
		//let old_x = bone.x;
		//let old_y = bone.y;
		
		//if ( power >= 1 )
		//{
			bone.x = x;
			bone.y = y;
		/*}
		else
		{
			bone.x = old_x * ( 1 - power ) + x * power;
			bone.y = old_y * ( 1 - power ) + y * power;
		}*/
		
		//bone.sx += x - old_x;
		//bone.sy += y - old_y;
	}
	RespectLength( boneA, boneB, min_len, max_len )
	{
		let dx,dy,di;
		
		dx = boneB.x - boneA.x;
		dy = boneB.y - boneA.y;
		di = sdWorld.Dist2D_Vector( dx, dy );
		if ( di < min_len )
		{
			this.MoveBoneAbsolute( boneB,
				boneA.x + dx / di * min_len,
				boneA.y + dy / di * min_len,
				1
			);
		}
		else
		if ( di > max_len )
		{
			this.MoveBoneAbsolute( boneB,
				boneA.x + dx / di * max_len,
				boneA.y + dy / di * max_len,
				1
			);
		}
	}
	AliveUpdate()
	{
		this.ever_updated = true;
		
		// Side update might not happen in else case if entity appears as dead
		this.character._side = ( this.character.x < this.character.look_x ) ? 1 : -1;
		
		/*for ( let i = 0; i < this.bones.length; i++ )
		if ( this.bones[ i ] !== this.knee1 )
		if ( this.bones[ i ] !== this.knee2 )
		{
			// Reset because it will be added
			this.bones[ i ].sx = 0;
			this.bones[ i ].sy = 0;
		}*/
		
		const offset_discretion = 2;
		const movement_discretion = 10;
		
		let gun_offset_x = 0;
		let gun_offset_y = 0;
		let gun_offset_body_x = 0;
		if ( this.character.gun_slot === 0 )
		{
			gun_offset_x += ( 1 - ( Math.cos( this.character.fire_anim / 5 * Math.PI ) * 0.5 + 0.5 ) ) * 3;
			gun_offset_body_x += 1 - ( Math.cos( this.character.fire_anim / 5 * Math.PI ) * 0.5 + 0.5 );
		}
		else
		{
			gun_offset_x -= 1 - ( Math.cos( this.character.fire_anim / 5 * Math.PI ) * 0.5 + 0.5 );
			gun_offset_body_x -= ( 1 - ( Math.cos( this.character.fire_anim / 5 * Math.PI ) * 0.5 + 0.5 ) ) * 0.333;
		}
		gun_offset_x = Math.ceil( Math.abs( gun_offset_x ) * offset_discretion ) * Math.sign( gun_offset_x ) / offset_discretion;
		gun_offset_body_x = Math.ceil( Math.abs( gun_offset_body_x ) * offset_discretion ) * Math.sign( gun_offset_body_x ) / offset_discretion;
		
		
		
		let reload = 0;
		if ( this.character.reload_anim > 0 )
		{
			if ( this.character.reload_anim > 30 / 3 * 2 )
			{
				//image = sdCharacter.img_body_reload2;
				//frame = 'img_body_reload2';
				reload = 1;
			}
			else
			if ( this.character.reload_anim > 30 / 3 * 1 )
			{
				//image = sdCharacter.img_body_reload1;
				//frame = 'img_body_reload1';
				reload = 2;
			}
			else
			{
				//image = sdCharacter.img_body_reload2;
				//frame = 'img_body_reload2';
				reload = 1;
			}
			gun_offset_x -= 1;
			gun_offset_y += 2 + reload;
		}
		
		
		// Body & head
		this.MoveBone( this.torso, 13, 22 );
		let dx = -( this.chest.y - this.character.look_y ) * this.character._side;
		let dy = ( this.chest.x - this.character.look_x ) * this.character._side;
		let di = sdWorld.Dist2D_Vector( dx, dy );
		if ( di > 0.01 )
		{
			dx /= di;
			dy /= di;
		}
		dx += gun_offset_body_x * this.character._side + this.character.act_x;
		dy -= 3;
		if ( this.character.pain_anim > 0 )
		{
			dx -= this.character._side * 1;
			dy -= 1;
		}
		di = sdWorld.Dist2D_Vector( dx, dy );
		if ( di > 0.01 )
		{
			dx /= di;
			dy /= di;
		}
		this.MoveBoneRelative( this.spine, this.torso.x + dx * 6, this.torso.y + dy * 6 );
		this.MoveBoneRelative( this.chest, this.torso.x + dx * 8, this.torso.y + dy * 8 );
		this.MoveBoneRelative( this.neck, this.torso.x + dx * 11, this.torso.y + dy * 11 );
		
		if ( reload <= 0 )
		{
			dx = ( this.chest.x - this.character.look_x );
			dy = ( this.chest.y - this.character.look_y );
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}
			dx -= this.character._side * 0.5;
			dy -= 0.5;
			
			if ( this.character._ledge_holding ) // Prevent starnge head rotations backwards
			{
				dx = -Math.abs( dx + this.character._side * 0.5 ) * this.character._side - this.character._side * 0.5;
			}
			
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}
			
		}
		else
		{
			dx = ( this.head.x - this.hand1.x );
			dy = ( this.head.y - this.hand1.y );
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}
			dx -= this.character._side * 1;
			dy -= 1;
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}
		}
		if ( this.character.pain_anim > 0 )
		{
			dx -= 1 * this.character._side;
			dy += 1;
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}
		}
		this.MoveBoneRelative( this.head, this.neck.x - dy * 4 * this.character._side, this.neck.y + dx * 4 * this.character._side );
		
		
		
		// Legs
		let _anim_walk = Math.round( this.character._anim_walk / 10 * movement_discretion ) / movement_discretion * Math.PI * 2;
		
		let walk_amplitude_x = 1.5;
		let walk_amplitude_y = 0;
		let _anim_walk_arms = 0;
		
			
		let legs_x = 13;
		let legs_y = 30;
		
		if ( !this.character.stands && this.character._crouch_intens <= 0.25 )
		{
			walk_amplitude_x = 4;
        
            legs_x += Math.max( -2, Math.min( 2, this.character.sx ) ) * this.character._side;
            //legs_y -= 2;

			walk_amplitude_y =  - Math.max( -4, Math.min( 4, this.character.sy ) );
			
			_anim_walk_arms = 6;
		}
		else
		{
			if ( this.character._crouch_intens > 0.25 )
			{
				legs_x -= 1;
				legs_y -= 4;
				
				if ( this.character.act_x !== 0 )
				walk_amplitude_x = this.character.act_x * this.character._side * Math.sin( _anim_walk ) * 2 + 4;
				else
				walk_amplitude_x = 4;
			
				_anim_walk_arms = 1;
			}
			else
			{
				if ( this.character.act_x !== 0 )
				{
					walk_amplitude_x = this.character.act_x * this.character._side * Math.sin( _anim_walk ) * 5;
					walk_amplitude_y = Math.cos( _anim_walk ) * 4;
					legs_x -= 2.5;
					
					_anim_walk_arms = Math.sin( _anim_walk + 0.2 ) * 1;
				}
			}
		}
		
		this.MoveBone( this.ankle1, legs_x + walk_amplitude_x, legs_y - Math.max( 0, walk_amplitude_y ) );
		this.MoveBone( this.ankle2, legs_x - walk_amplitude_x, legs_y - Math.max( 0, -walk_amplitude_y ) );
		this.MoveBone( this.toes1, legs_x + walk_amplitude_x + 2, legs_y - Math.max( 0, walk_amplitude_y ) );
		this.MoveBone( this.toes2, legs_x - walk_amplitude_x + 2, legs_y - Math.max( 0, -walk_amplitude_y ) );
		
		let leg_len = 8;

		this.RespectLength( this.torso, this.ankle1, 1, leg_len );
		this.RespectLength( this.torso, this.ankle2, 1, leg_len );

		if ( !this.character.stands || this.character.act_x !== 0 )
		{
			this.RespectLength( this.torso, this.toes1, 1, leg_len );
			this.RespectLength( this.torso, this.toes2, 1, leg_len );
		}
		
		
		
		
		
		
		
		
		// Arms
		dx = -( this.chest.x - this.character.look_x );
		dy = -( this.chest.y - this.character.look_y );
		di = sdWorld.Dist2D_Vector( dx, dy );
		if ( di > 0.01 )
		{
			dx /= di;
			dy /= di;
		}
		dx += gun_offset_y / 9 * 2 * this.character._side;
		dy += gun_offset_y / 9;

        dx += this.character._side * ( 1 - ( 0.5 + dy * 0.5 ) ); // Applying effect when looking only in one of directions
        if ( reload )
        {
            dx += this.character._side;
            dy += 1;
	    }
		
		di = sdWorld.Dist2D_Vector( dx, dy );
		if ( di > 0.01 )
		{
			dx /= di;
			dy /= di;
		}
		if ( this.character._inventory[ this.character.gun_slot ] || ( this.character.fire_anim > 0 && this.character.fire_anim < 5 ) )
		{
			this.MoveBoneRelative( this.hand1, this.chest.x + dx * ( 9 + gun_offset_x - reload ), this.chest.y + 0 + dy * ( 9 + gun_offset_x - reload ) );
			this.MoveBoneRelative( this.hand2, this.chest.x + dx * ( 9 + gun_offset_x - 3 + reload ), this.chest.y + 0 + dy * ( 9 + gun_offset_x - 3 + reload ) + 2 );
		}
		else
		{
			this.MoveBoneRelative( this.hand1, this.chest.x - _anim_walk_arms, this.chest.y + 6 );
			this.MoveBoneRelative( this.hand2, this.chest.x + _anim_walk_arms, this.chest.y + 6 );
		}
		
		
		
		
		
		
		
		
		// Fix knees and elbows
		//this.MoveBoneRelative( this.knee1, this.torso.x + 32 * this.character._side, this.torso.y );
		//this.MoveBoneRelative( this.knee2, this.torso.x + 32 * this.character._side, this.torso.y );
		this.MoveBoneRelative( this.elbow1, this.torso.x - 32 * this.character._side, this.torso.y + 32 );
		this.MoveBoneRelative( this.elbow2, this.torso.x - 32 * this.character._side, this.torso.y + 32 );
		/*
		
			Find elevation:
		
							C
						  / | \
						\   |   /
					4 \  	|     / 4
					/   	|?      \
				  / 		|         \
				 A ---|--- C0 ---|---- B
		
				A = torso
				B = ankle1
				C = knee1
				C0 - projection of C on AB
		
				AC = CB = 4
		
				CC0 - ?

					AC0^2 + CC0^2 = AC^2
					AC0^2 + CC0^2 = 16
					CC0 = sqrt( 16 - AC0^2 )
				
				AC0 = AB / 2
		
					CC0 = sqrt( 16 - ( AB / 2 )^2 )
		*/
		const SolveKneePosition = ( torso, ankle, knee, side )=>
		{
			let c0x = ( torso.x + ankle.x ) / 2;
			let c0y = ( torso.y + ankle.y ) / 2;

			let ab = sdWorld.Dist2D( torso.x, torso.y, ankle.x, ankle.y );
			let cc0 = 16 - Math.pow( ab / 2, 2 );
			if ( cc0 > 0 )
			cc0 = Math.sqrt( cc0 ) * side;
			else
			cc0 = 0;

			dx = ankle.x - torso.x;
			dy = ankle.y - torso.y;
			di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 0.01 )
			{
				dx /= di;
				dy /= di;
			}

			knee.x = c0x + dy * cc0;
			knee.y = c0y - dx * cc0;
		};
		SolveKneePosition( this.torso, this.ankle1, this.knee1, this.character._side );
		SolveKneePosition( this.torso, this.ankle2, this.knee2, this.character._side );
		
		
		for ( let i = 0; i < 2; i++ ) // A little bit more iterations
		{
			//this.RespectLength( this.torso, this.knee1, 4, 4 );
			//this.RespectLength( this.torso, this.knee2, 4, 4 );
			//this.RespectLength( this.ankle1, this.knee1, 4, 4 );
			//this.RespectLength( this.ankle2, this.knee2, 4, 4 );

			this.RespectLength( this.hand1, this.elbow1, 4, 6 );
			this.RespectLength( this.hand2, this.elbow2, 4, 6 );
			this.RespectLength( this.chest, this.elbow1, 2, 3 );
			this.RespectLength( this.chest, this.elbow2, 2, 3 );
		}
		
		var an = this.character.tilt / 100;
		var cos = Math.cos( an );
		var sin = Math.sin( an );
		
		dx = this.spine.x;
		dy = this.spine.y;
		
		for ( let i = 0; i < this.bones.length; i++ )
		{
			this.bones[ i ].x -= dx;
			this.bones[ i ].y -= dy;
			
			var nx = cos * this.bones[ i ].x - sin * this.bones[ i ].y;
			this.bones[ i ].y = sin * this.bones[ i ].x + cos * this.bones[ i ].y;
			this.bones[ i ].x = nx;
			
			this.bones[ i ].x += dx;
			this.bones[ i ].y += dy;
		}
	}
	
	Delete( preview_screeen_mode=false )
	{
		if ( this.character )
		{
			this.character._ragdoll = null;

			this.character = null;

			for ( let i = 0; i < this.bones.length; i++ )
			{
				this.bones[ i ].remove();
				if ( preview_screeen_mode )
				{
					this.bones[ i ]._remove();
					
					let id = sdEntity.entities.indexOf( this.bones[ i ] );
					if ( id !== -1 )
					sdEntity.entities.splice( id, 1 );
				}
			}
		}
	}
	
	AddBone( part_name, x, y, radius, bounciness=undefined, friction_remain=undefined )
	{
		if ( typeof this[ part_name ] !== 'undefined' )
		throw new Error( 'Bone "'+part_name+'" already exists' );
	
		let bone = new sdBone({ x:this.character.x + x - 16, y:this.character.y + y - 16, radius:radius * 0.5, ragdoll:this, sx:this.character.sx, sy:this.character.sy, bone_name:part_name, initial_x:x, initial_y:y, bounciness:bounciness, friction_remain:friction_remain, soft_bone_of:null });
		sdEntity.entities.push( bone );
		this.bones.push( bone );
	
		// Has side effect of mass increase. Makes impacts more interesting
		if ( radius > 2 )
		{
			let soft_bone = new sdBone({ x:this.character.x + x - 16, y:this.character.y + y - 16, radius:radius, ragdoll:this, sx:this.character.sx, sy:this.character.sy, bone_name:'soft_'+part_name, initial_x:x, initial_y:y, bounciness:bounciness, friction_remain:friction_remain, soft_bone_of:bone });
			sdEntity.entities.push( soft_bone );
			this.springs.push( new sdSpring( bone, soft_bone, null, 0, 0, 0, sdCharacterRagdoll.spring_both ) );
			this.bones.push( soft_bone );
		}
	
		this[ part_name ] = bone;
		
	}
	
	Think( GSPEED )
	{
		if ( this.character.hea <= 0 )
		{
			if ( this.last_char_hea > 0 )
			{
				let p;

				this._stress = 0;

				for ( let i = 0; i < this.bones.length; i++ )
				{
					if ( this.bones[ i ]._soft_bone_of )
					{
						this.bones[ i ].x = this.bones[ i ]._soft_bone_of.x;
						this.bones[ i ].y = this.bones[ i ]._soft_bone_of.y;
						this.bones[ i ].sx = this.bones[ i ]._soft_bone_of.sx;
						this.bones[ i ].sy = this.bones[ i ]._soft_bone_of.sy;
					}
					else
					{
						let an = sdCharacterRagdoll.SeededRandomNumberGenerator.random( this.character._net_id || 0, i * 2 + 0 ) * Math.PI * 2;
						let p = sdCharacterRagdoll.SeededRandomNumberGenerator.random( this.character._net_id || 0, i * 2 + 1 ) * 5;
						/*this.bones[ i ].sx = Math.sin( an ) * p;
						this.bones[ i ].sy = Math.cos( an ) * p;*/

						this.bones[ i ].sx = -Math.max( -1, Math.min( ( this.bones[ i ].y - this.torso.y ) / 1, 1 ) ) * Math.max( -0.5, Math.min( this.character.sx, 0.5 ) ) * 2 + Math.sin( an ) * p;
						this.bones[ i ].sy = Math.cos( an ) * p;

						//this.bones[ i ].sx = 0;
						//this.bones[ i ].sy = 0;

						p = 0.7;
						if ( this.character.sy >= 0 && this.character._in_air_timer <= 1 )
						{
							p *= 0.35;
						}
						this.bones[ i ].sx += this.character.sx * p;
						this.bones[ i ].sy += this.character.sy * p;
					}
					
					//console.log( this.bones[ i ]._bone_name, this.bones[ i ].sx, this.bones[ i ].sy );
				}
			}
		}
		this.last_char_hea = this.character.hea;
		
		if ( this.character.hea > 0 )
		return;
			
		//if ( !allow_alive_update )
		//if ( this.character.hea > 0 )
		//return;
	
		if ( GSPEED > 1 )
		GSPEED = 1;
	
		//GSPEED = Math.random() * 0.9 + 0.1;
	
		let side = this.character._side;
		
		let i,a,b,di,target_di,p,dx,dy,limit_mode,c,always_left,avx,avy,avsx,avsy;
		
		// Pulling towards logical server-side position of sdCharacter
		avx = 0;
		avy = 0;
		avsx = 0;
		avsy = 0;
		
		for ( i = 0; i < this.bones.length; i++ )
		{
			avx += this.bones[ i ].x;
			avy += this.bones[ i ].y;
			avsx += this.bones[ i ].sx;
			avsy += this.bones[ i ].sy;
		}
		avx /= this.bones.length;
		avy /= this.bones.length;
		avsx /= this.bones.length;
		avsy /= this.bones.length;
		
		dx = this.character.x + ( this.character._hitbox_x1 + this.character._hitbox_x2 ) / 2 - avx;
		dy = this.character.y + ( this.character._hitbox_y1 + this.character._hitbox_y2 ) / 2 - avy;
		
		di = sdWorld.Dist2D_Vector( dx, dy );
		
		dx += ( this.character.sx - avsx ) * 5;
		dy += ( this.character.sy - avsy ) * 5;
		
		target_di = sdWorld.Dist2D_Vector( dx, dy ); // For stress
			
		if ( target_di > 10 && di > 5 )
		this._stress = sdWorld.MorphWithTimeScale( this._stress, 1, 0.99, GSPEED );
		else
		this._stress = sdWorld.MorphWithTimeScale( this._stress, 0.1, 0.99, GSPEED );

		p = 0.1 * GSPEED * this._stress;
		
		//if ( false ) // Hack, debugging fast random pulls on death
		if ( di > 5 )
		for ( i = 0; i < this.bones.length; i++ )
		{
			//if ( di > 15 )
			if ( this._stress > 0.8 )
			{
				//if ( this.bones[ i ]._phys_sleep > 0 )
				//{
					this.bones[ i ].sx += dx * p;
					this.bones[ i ].sy += dy * p;
				//}

				this.bones[ i ].x += dx * p;
				this.bones[ i ].y += dy * p;
			}
			else
			{
				this.bones[ i ].RelaxedPush( dx * p, dy * p );
			}
		}
		
		let steps = ( this.character.hea <= 0 ) ? 2 : 0; // 5 is best for ragdolls that are partially stuck on ledges
		
		const solver_strength = 1; // Do not use values above 1
		
		GSPEED /= steps;
		for ( let s = 0; s < steps; s++ )
		{
			//if ( s === 0 )
			for ( i = 0; i < this.bones.length; i++ )
			{
				if ( sdWorld.inDist2D_Boolean( this.bones[ i ]._rag_lx, this.bones[ i ]._rag_ly, this.bones[ i ].x, this.bones[ i ].y, 2 ) && 
				      this._stress < 0.2 &&
				      sdWorld.CheckWallExistsBox( 
							this.bones[ i ].x-5, 
							this.bones[ i ].y, 
							this.bones[ i ].x+5, 
							this.bones[ i ].y+8, this.bones[ i ], this.bones[ i ].GetIgnoredEntityClasses(), this.bones[ i ].GetNonIgnoredEntityClasses(), null ) )
				{
					this.bones[ i ]._phys_last_sx = ( this.bones[ i ].sx > 0 );
					this.bones[ i ]._phys_last_sy = ( this.bones[ i ].sy > 0 );
					/*
					if ( this.bones[ i ]._phys_sleep >= 0 && this.bones[ i ]._phys_sleep < 10 )
					{
						//this.bones[ i ]._phys_sleep / 10
						this.bones[ i ].sx = sdWorld.MorphWithTimeScale( this.bones[ i ].sx, 0, 0.9, GSPEED );
						this.bones[ i ].sy = sdWorld.MorphWithTimeScale( this.bones[ i ].sy, 0, 0.9, GSPEED );
					}*/
				}
				else
				{
					this.bones[ i ]._phys_sleep = Math.max( 1, this.bones[ i ]._phys_sleep );
					
					this.bones[ i ]._rag_lx = this.bones[ i ].x;
					this.bones[ i ]._rag_ly = this.bones[ i ].y;
					
					if ( this.character.hea <= 0 )
					this.bones[ i ].sy += sdWorld.gravity * GSPEED;
				}
			
				this.bones[ i ].ApplyVelocityAndCollisions( GSPEED, 0, true );
				/*
				if ( s === 0 )
				if ( this.character._key_states.GetKey('Mouse1') )
				{
					this.bones[ i ].PhysWakeUp();
					
					this.bones[ i ].sx = this.bones[ i ].x;
					this.bones[ i ].sy = this.bones[ i ].y;
					
					this.bones[ i ].x = this.character.look_x + this.bones[ i ]._initial_x - 16;
					this.bones[ i ].y = this.character.look_y + this.bones[ i ]._initial_y - 16;
					
					this.bones[ i ].sx = this.bones[ i ].x - this.bones[ i ].sx;
					this.bones[ i ].sy = this.bones[ i ].y - this.bones[ i ].sy;
				}*/
			}
			//if ( false ) // Hack
			for ( i = 0; i < this.springs.length; i++ )
			{
				a = this.springs[ i ].parent;
				b = this.springs[ i ].child;
				
				if ( a._phys_sleep > 0 || b._phys_sleep > 0 )
				{
					target_di = this.springs[ i ].radius;
					limit_mode = this.springs[ i ].limit_mode;

					dx = b.x - a.x;
					dy = b.y - a.y;

					di = sdWorld.Dist2D_Vector( dx, dy );

					//if ( limit_mode === sdCharacterRagdoll.spring_both || ( limit_mode === sdCharacterRagdoll.spring_min && di < target_di ) || ( limit_mode === sdCharacterRagdoll.spring_max && di > target_di ) )
					if ( limit_mode === sdCharacterRagdoll.spring_both || ( this.character.hea <= 0 && limit_mode === sdCharacterRagdoll.spring_min && di < target_di ) || ( this.character.hea <= 0 && limit_mode === sdCharacterRagdoll.spring_max && di > target_di ) ) // Disable limiters as they will interfere with crouching
					if ( Math.abs( di - target_di ) > 0.1 )
					{
						//p = 1 / di * ( di - target_di ) * 0.5 * GSPEED;
						p = 1 / di * ( di - target_di ) * 0.5 * solver_strength;
						
						//p *= 0.1; // Hack, debugging random pulls
						/*
						if ( Math.abs( p * dy ) > 5 )
						{
							console.log( 'Found spring force', Math.abs( p * dy ), this.springs[ i ], di, target_di );
						}
*/
						a.RelaxedPush( dx * p, dy * p );
						b.RelaxedPush( -dx * p, -dy * p );
						
						a._phys_sleep = b._phys_sleep = Math.max( a._phys_sleep, b._phys_sleep );
					}
				}
			}
			//if ( false ) // Hack
			for ( i = 0; i < this.angular_restrictors.length; i++ )
			{
				a = this.angular_restrictors[ i ][ 0 ];
				b = this.angular_restrictors[ i ][ 1 ];
				c = this.angular_restrictors[ i ][ 2 ];
				
				if ( a._phys_sleep > 0 || b._phys_sleep > 0 || c._phys_sleep > 0 )
				{
					always_left = this.angular_restrictors[ i ][ 3 ];

					if ( ( ( ( b.x - a.x ) * ( c.y - a.y ) - ( b.y - a.y ) * ( c.x - a.x ) ) * side > 0 ) === always_left )
					//while ( ( ( ( b.x - a.x ) * ( c.y - a.y ) - ( b.y - a.y ) * ( c.x - a.x ) ) * side > 0 ) === always_left )
					{
						di = sdWorld.distToSegmentSquared( c, a, b ); // p is tested point, v and w is a segment

						if ( di > 0.0001 )
						{
							dx = sdWorld.reusable_closest_point.x - c.x;
							dy = sdWorld.reusable_closest_point.y - c.y;

							//p = 0.5 * GSPEED;
							p = 0.5 * solver_strength;
							//p = 1 * GSPEED;

							c.RelaxedPush( dx * p, dy * p );
							//if ( !c.RelaxedPush( dx * p, dy * p ) )
							//break;
							
							if ( this.character.hea <= 0 )
							{
								p /= 2;
								a.RelaxedPush( -dx * p, -dy * p );
								b.RelaxedPush( -dx * p, -dy * p );
							}
							a._phys_sleep = b._phys_sleep = c._phys_sleep = Math.max( a._phys_sleep, b._phys_sleep, c._phys_sleep );
						}
						//else
						//break;
					}
				}
			}
		}
	}
	
	DrawRagdoll( ctx, attached )
	{
		if ( this.character.hea > 0 || !this.ever_updated )
		{
			this.AliveUpdate();
			//this.Think( 0.001, true );
		}
		
		let skin_images_by_subgroup = [
			sdCharacter.skins[ this.character.body ],
			sdCharacter.skins[ this.character.legs ]
		];
		
		let char_filter = ctx.filter;
	
		let side = this.character._side;
		
		let spring;
		
		let source_y_offset = ( this.character.hea <= this.character.hmax / 2 ) ? 32 : 0; // Gory version
		
		let gun_counter = 0;
		
		if ( !this.character.driver_of || attached )
		for ( let i = 0; i < this.springs.length; i++ )
		if ( this.springs[ i ].image !== null )
		{
			spring = this.springs[ i ];

			ctx.save();
			{
				ctx.translate( spring.parent.x - this.character.x, spring.parent.y - this.character.y );
				
				ctx.rotate( Math.atan2( spring.parent.y - spring.child.y, spring.parent.x - spring.child.x ) );
				
				ctx.scale( 1, side );

				if ( spring.image === 96 ) // lower arm
				if ( gun_counter++ === 1 )
				if ( this.character._inventory[ this.character.gun_slot ] && !attached )
				{
					ctx.save();
					{
						ctx.translate( -7, 3 );

						ctx.rotate( ( Math.PI / 2 - this.character.GetLookAngle( true ) - Math.atan2( spring.parent.y - spring.child.y, spring.parent.x - spring.child.x ) ) * this.character._side );

						ctx.filter = 'none';
						ctx.sd_filter = null;
								
						this.character._inventory[ this.character.gun_slot ].Draw( ctx, true );
						
						ctx.filter = char_filter;
						ctx.sd_filter = this.character.sd_filter;
					}
					ctx.restore();
				}
				
				ctx.rotate( spring.turn );
				
				if ( spring.image === 224 ) // offset of a helmet image
				{
					if ( this.character.death_anim >= 30 )
					{
						if ( !this.character.sd_filter )
						{
							this.character.sd_filter = {};
							sdWorld.ReplaceColorInSDFilter( this.character.sd_filter, [ 255, 0, 0 ], [ 254, 0, 0 ] );
						}
						
						if ( this.character.sd_filter !== this.character._sd_filter_old )
						{
							this.character._sd_filter_old = this.character.sd_filter;

							this.character._sd_filter_darkened = Object.assign( {}, this.character.sd_filter );

							this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] = ~~( this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] * 0.5 );
							this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] = ~~( this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] * 0.5 );
							this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] = ~~( this.character._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] * 0.5 );
						}

						ctx.sd_filter = this.character._sd_filter_darkened;
					}
					
					this.character.DrawHelmet( ctx );
				}
				else
				{
					if ( !this.character.driver_of || spring.subgroup !== 1 ) // No legs in vehicles
					{
						ctx.drawImageFilterCache( skin_images_by_subgroup[ spring.subgroup ], spring.image,source_y_offset, 32,32, -16,-16, 32,32 );

						if ( this.character.flying )
						{
							if ( spring.image === 32 ) // Body upper
							{
								ctx.filter = 'none';
								ctx.sd_filter = null;

								ctx.drawImageFilterCache( sdCharacter.img_jetpack, - 16 + 2, - 16, 32,32 );

								ctx.filter = char_filter;
								ctx.sd_filter = this.character.sd_filter;
							}
						}
					}
				}
			}
			ctx.restore();
		}
		
		
		
		/*
		sdCharacter.skin_part_indices.body_lower;
		
		ctx.save();
		
		
		
		ctx.restore();*/
	}
}

class sdSpring
{
	constructor( parent, child, image=null, subgroup=0, z_offset=0, turn=0, limit_mode=0 )
	{
		this.parent = parent;
		this.child = child;
		this.radius = sdWorld.Dist2D( parent.x, parent.y, child.x, child.y );
		this.image = image ? sdCharacter.skin_part_indices[ image ] * 32 : null;
		this.subgroup = subgroup;
		this.z_offset = z_offset;
		this.turn = turn - Math.atan2( this.parent.y - this.child.y, this.parent.x - this.child.x );
		this.limit_mode = limit_mode;
	}
}

class sdBone extends sdEntity
{
	get hitbox_x1() { return -this.radius; }
	get hitbox_x2() { return this.radius; }
	get hitbox_y1() { return -this.radius; }
	get hitbox_y2() { return this.radius; }
	
	get hard_collision()
	{ return false; }
	/*
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	*/
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( sdWorld.is_server )
		{
			return false;
		}
	}
	
	constructor( params )
	{
		super( params );
		
		this._bone_name = params.bone_name;
		
		this.radius = params.radius;
		this.ragdoll = params.ragdoll;
		
		this.sx = params.sx;
		this.sy = params.sy;
		
		this._initial_x = params.initial_x;
		this._initial_y = params.initial_y;
		
		this._rag_lx = this.x;
		this._rag_ly = this.y;

		this._bounciness = params.bounciness || 0.15; // 0.25
		this._friction_remain = params.friction_remain || 0.7;
		
		this._soft_bone_of = params.soft_bone_of || null;
		
		//if ( this._bone_name === 'head' )
		//this._bounciness = 0.5;
		
		if ( sdWorld.is_server )
		{
			this.remove(); // Remove or at least schedule removal - these should not exist on server for more than one frame
		}
		else
		{
			if ( sdEntity.active_entities.length > 50000 ) // Somehow it gets flooded with bones when tab is inactive, catching
			debugger;
		}
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions. Most probably will have conflicts with .GetNonIgnoredEntityClasses()
	{
		return [ 'sdCharacter' ];
	}
	
	RelaxedPush( xx, yy )
	{
		this.sx += xx;
		this.sy += yy;

		if ( this.CanMoveWithoutOverlap( this.x + xx, this.y + yy ) )
		{
			this.x += xx;
			this.y += yy;
			
			return true;
		}
		return false;
	}
	
	
	get bounce_intensity()
	{ return this._bounciness; }
	
	get friction_remain()
	{ return this._friction_remain; }
	
	get mass() { return 5.7; } // 80 / 14
	
	/*onThink( GSPEED ) // Class-specific, if needed
	{
		//this.sy += sdWorld.gravity * GSPEED;
		
		//this.sx += ( Math.random() - 0.5 ) / 30;
		//this.sy += ( Math.random() - 0.5 ) / 30;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}*/
	DrawFG( ctx, attached )
	{
		/*ctx.fillStyle = '#3745ff';
		ctx.fillRect( -1, -1, 2, 2 );
		ctx.fillStyle = '#00aeff';
		ctx.fillRect( -0.5, 0.5, 1, 1 );*/
	}
	onRemove() // Class-specific, if needed
	{
		this.ragdoll.Delete();
	}
}

export default sdCharacterRagdoll;