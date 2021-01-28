
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCrystal from './sdCrystal.js';
import sdVirus from './sdVirus.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBG from './sdBG.js';

import sdRenderer from '../client/sdRenderer.js';

import sdSound from '../sdSound.js';

class sdBlock extends sdEntity
{
	static init_class()
	{
		sdBlock.img_wall22 = sdWorld.CreateImageFromFile( 'wall_2x2' );
		sdBlock.img_wall21 = sdWorld.CreateImageFromFile( 'wall_2x1' );
		sdBlock.img_wall12 = sdWorld.CreateImageFromFile( 'wall_1x2' );
		sdBlock.img_wall11 = sdWorld.CreateImageFromFile( 'wall_1x1' );
		sdBlock.img_wall05 = sdWorld.CreateImageFromFile( 'wall_half' );
		
		sdBlock.img_sharp = sdWorld.CreateImageFromFile( 'sharp2' );
		sdBlock.img_sharp_inactive = sdWorld.CreateImageFromFile( 'sharp2_inactive' );
		
		sdBlock.MATERIAL_WALL = 0;
		sdBlock.MATERIAL_GROUND = 1;
		sdBlock.MATERIAL_SHARP = 2;
		
		sdBlock.img_ground11 = sdWorld.CreateImageFromFile( 'ground_1x1' );
		
		sdBlock.cracks = [ 
			null,
			sdWorld.CreateImageFromFile( 'cracks1' ),
			sdWorld.CreateImageFromFile( 'cracks2' ),
			sdWorld.CreateImageFromFile( 'cracks3' )
		];
		
		let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	get hard_collision()
	{ return this.material !== sdBlock.MATERIAL_SHARP; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( this._contains_class === 'sdVirus' )
		dmg = this._hea + 1;
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			this.HandleDestructionUpdate();
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdBlock.MATERIAL_WALL;
		
		this._hmax = 550 * ( this.width / 32 * this.height / 32 ) * ( this.material === sdBlock.MATERIAL_GROUND ? 0.8 : 1 );
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._contains_class = params.contains_class || null;
		//this._hidden_crystal = params.hidden_crystal || false;
		//this._hidden_virus = params.hidden_virus || false;
		
		this.filter = params.filter || '';
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			this._owner = params.owner || null; // Useful in case of sharp trap
			this.spikes_ani = 0; // 30 when somebody near, 15...30 - visible spikes, 0...15 - not visible spikes
		}
		
		this.destruction_frame = 0;
		this.HandleDestructionUpdate();
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter + ( this.material === sdBlock.MATERIAL_SHARP ? 30 : 0 );
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return Math.min( this.width, 16 ); };
	get spawn_align_y(){ return Math.min( this.height, 16 ); };
	
	HandleDestructionUpdate()
	{
		let old_destruction_frame = this.destruction_frame;
		
		if ( this._hea > this._hmax / 4 * 3 )
		this.destruction_frame = 0;
		else
		if ( this._hea > this._hmax / 4 * 2 )
		this.destruction_frame = 1;
		else
		if ( this._hea > this._hmax / 4 * 1 )
		this.destruction_frame = 2;
		else
		this.destruction_frame = 3;
		
		if ( this.destruction_frame !== old_destruction_frame )
		this._update_version++;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
				this.HandleDestructionUpdate();
			}
		}
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			if ( this.spikes_ani > 0 )
			{
				this.spikes_ani = Math.max( 0, this.spikes_ani - GSPEED );
				this._update_version++;
			}
			else
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		if ( this._hea === this._hmax )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this.material === sdBlock.MATERIAL_SHARP )
		if ( from_entity.IsBGEntity() === this.IsBGEntity() )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null ) // Do not react to held guns
		{
			if ( this.spikes_ani === 0 )
			if ( sdWorld.GetComsNear( this.x + this.width / 2, this.y + this.height / 2, null, from_entity._net_id ).length === 0 ) // Do not damage teammates
			{
				this.spikes_ani = 30;
				this._update_version++;
				
				sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
				from_entity.Damage( 100, this._owner );
				
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
		}
	}
	Draw( ctx, attached )
	{
		var w = this.width;
		var h = this.height;
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		//ctx.filter = 'hsl(120,100%,25%)';
		
		if ( this.material === sdBlock.MATERIAL_GROUND )
		{
			ctx.drawImageFilterCache( sdBlock.img_ground11, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_WALL )
		{
			if ( w === 32 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_wall22, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 32 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_wall21, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_wall12, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_wall11, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 8 )
			ctx.drawImageFilterCache( sdBlock.img_wall05, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			ctx.drawImage( ( this.spikes_ani < 15 ) ? sdBlock.img_sharp_inactive : sdBlock.img_sharp, 0, 0, w,h, 0,0, w,h );
		}

		ctx.filter = 'none';
		
		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		ctx.drawImage( sdBlock.cracks[ this.destruction_frame ], 0, 0, w,h, 0,0, w,h );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._contains_class )
			{
				let ent = new sdWorld.entity_classes[ this._contains_class ]({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
				sdEntity.entities.push( ent );
			}

			let nears = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, Math.max( this.width, this.height ) / 2 + 16 );
			for ( let i = 0; i < nears.length; i++ )
			if ( nears[ i ] instanceof sdWater )
			{
				nears[ i ].AwakeSelfAndNear();
				//nears[ i ]._sleep_tim = sdWater.sleep_tim_max;
			}
	
			if ( this.material === sdBlock.MATERIAL_GROUND )
			{
				let new_bg = new sdBG({ x:this.x, y:this.y, width:this.width, height:this.height, material:sdBG.MATERIAL_GROUND, filter:this.filter + ' brightness(0.5)' });
				if ( new_bg.CanMoveWithoutOverlap( this.x, this.y, 1 ) )
				{
					sdEntity.entities.push( new_bg );
				}
				else
				{
					new_bg.remove();
					new_bg._remove();
				}
			}
		}
		
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'block4', 
				x:this.x + this.width / 2, 
				y:this.y + this.height / 2, 
				volume:( this.width / 32 ) * ( this.height / 32 ), 
				pitch: ( this.material === sdBlock.MATERIAL_WALL || this.material === sdBlock.MATERIAL_SHARP ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < this.width; x += step_size )
			for ( y = step_size / 2; y < this.height; y += step_size )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
		}
	}
}
//sdBlock.init_class();

export default sdBlock;