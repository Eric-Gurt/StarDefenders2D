
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';

class sdMatterContainer extends sdEntity
{
	static init_class()
	{
		sdMatterContainer.img_matter_container = sdWorld.CreateImageFromFile( 'matter_container' );
		sdMatterContainer.img_matter_container_empty = sdWorld.CreateImageFromFile( 'matter_container_empty' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return  ( -10 - ( 12 * this.variation ) ); }
	get hitbox_x2() { return ( 10 + ( 12 * this.variation ) ); }
	get hitbox_y1() { return ( -14 - ( 16 * this.yvariation ) ); }
	get hitbox_y2() { return ( 14 + ( 16 * this.yvariation ) ); }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	RequireSpawnAlign()
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.variation = params.variation || 0; // How much other containers are "attached" to it horizontally
		this.yvariation = params.yvariation || 0; // How much other containers are "attached" to it vertically
		this.matter_max = params.matter_max * ( 1 + this.variation )  ||  640 * ( 1 + this.variation );
		
		this.matter = this.matter_max;

		this._last_sync_matter = this.matter;
		
		this._hmax = 320 * ( 1 + this.variation );
		this._hea = this._hmax;
		
		this._regen_timeout = 0;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		this._update_version++; // Just in case
		{
			if ( this.variation < 4 )
			{
				let target_raw = sdWorld.GetAnythingNear( this.x - ( 24 + ( 12 * this.variation )), this.y, 1, null, [ 'sdMatterContainer' ] );
				//let target = [];
				for ( let i = 0; i < target_raw.length; i++ )
				{
					if ( target_raw[i].GetClass() === 'sdMatterContainer' )
					{
						if ( target_raw[i].variation + ( 1 + this.variation ) <= 4 )
						{
							if ( target_raw[i].yvariation === this.yvariation ) // Are the column stacks equal?
							if ( ( target_raw[i].matter_max / ( 1 + target_raw[i].variation ) / ( 1 + target_raw[i].yvariation ) ) === ( this.matter_max / ( 1 + this.variation ) / ( 1 + this.yvariation ) ) ) // Is it the same colour?
							if ( sdWorld.CheckLineOfSight( this.x, this.y, target_raw[ i ].x, target_raw[ i ].y, target_raw[ i ], [ 'sdMatterContainer' ], [ 'sdBlock', 'sdDoor' ] ) )
							{
								target_raw[i].variation += 1 + this.variation;
								target_raw[i].matter_max += this.matter_max;
								target_raw[i].matter += this.matter;
								target_raw[i]._hmax += this._hmax;
								target_raw[i]._hea += this._hea;
								target_raw[i].x = target_raw[i].x + ( 12 * ( 1 + this.variation ) );
								this.matter = 0;
								this.remove();
								break;
							}
						}
					}
				}
			}
			if ( this.yvariation < 4 )
			{
				let target_raw = sdWorld.GetAnythingNear( this.x, this.y + ( 32 + ( 16 * this.yvariation ) ), 1, null, [ 'sdMatterContainer' ] );
				//let target = [];
				for ( let i = 0; i < target_raw.length; i++ )
				{
					if ( target_raw[i].GetClass() === 'sdMatterContainer' )
					{
						if ( target_raw[i].yvariation + ( 1 + this.yvariation ) <= 4 )
						{
							if ( this.variation === target_raw[i].variation ) // Vertical combining is only for equal rows
							if ( ( target_raw[i].matter_max / ( 1 + target_raw[i].variation ) / ( 1 + target_raw[i].yvariation ) ) === ( this.matter_max / ( 1 + this.variation ) / ( 1 + this.yvariation ) ) ) // Is it the same colour?
							if ( sdWorld.CheckLineOfSight( this.x, this.y, target_raw[ i ].x, target_raw[ i ].y, target_raw[ i ], [ 'sdMatterContainer' ], [ 'sdBlock', 'sdDoor' ] ) )
							{
								target_raw[i].yvariation += 1 + this.yvariation;
								target_raw[i].matter_max += this.matter_max;
								target_raw[i].matter += this.matter;
								target_raw[i]._hmax += this._hmax;
								target_raw[i]._hea += this._hea;
								target_raw[i].y = target_raw[i].y + ( 16 * ( 1 + this.yvariation ) );
								this.matter = 0;
								this.remove();
								break;
							}
						}
					}
				}
			}
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		
		this.MatterGlow( 0.01, 50 + ( 12 * this.variation ), GSPEED );
		/*
		var x = this.x;
		var y = this.y;
		for ( var xx = -2; xx <= 2; xx++ )
		for ( var yy = -2; yy <= 2; yy++ )
		//for ( var xx = -1; xx <= 1; xx++ )
		//for ( var yy = -1; yy <= 1; yy++ )
		{
			var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			for ( var i = 0; i < arr.length; i++ )
			if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
			if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 50 ) >= 0 )
			if ( arr[ i ] !== this )
			{
				this.TransferMatter( arr[ i ], 0.01, GSPEED );
			}
		}*/

		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.1 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;

			if ( sdWorld.is_server )
			{
				if ( this.variation < 4 )
				{
					let target_raw = sdWorld.GetAnythingNear( this.x - ( 24 + ( 12 * this.variation )), this.y, 1, null, [ 'sdMatterContainer' ] );
					//let target = [];
					for ( let i = 0; i < target_raw.length; i++ )
					{
						if ( target_raw[i].GetClass() === 'sdMatterContainer' )
						{
							if ( target_raw[i].variation + ( 1 + this.variation ) <= 4 )
							{
								if ( target_raw[i].yvariation === this.yvariation ) // Are the column stacks equal?
								if ( ( target_raw[i].matter_max / ( 1 + target_raw[i].variation ) / ( 1 + target_raw[i].yvariation ) ) === ( this.matter_max / ( 1 + this.variation ) / ( 1 + this.yvariation ) ) ) // Is it the same colour?
								if ( sdWorld.CheckLineOfSight( this.x, this.y, target_raw[ i ].x, target_raw[ i ].y, target_raw[ i ], [ 'sdMatterContainer' ], [ 'sdBlock', 'sdDoor' ] ) )
								{
									target_raw[i].variation += 1 + this.variation;
									target_raw[i].matter_max += this.matter_max;
									target_raw[i].matter += this.matter;
									target_raw[i]._hmax += this._hmax;
									target_raw[i]._hea += this._hea;
									target_raw[i].x = target_raw[i].x + ( 12 * ( 1 + this.variation ) );
									this.matter = 0;
									this.remove();
									break;
								}
							}
						}
					}
				}
				if ( this.yvariation < 4 )
				{
					let target_raw = sdWorld.GetAnythingNear( this.x, this.y + ( 32 + ( 16 * this.yvariation ) ), 1, null, [ 'sdMatterContainer' ] );
					//let target = [];
					for ( let i = 0; i < target_raw.length; i++ )
					{
						if ( target_raw[i].GetClass() === 'sdMatterContainer' )
						{
							if ( target_raw[i].yvariation + ( 1 + this.yvariation ) <= 4 )
							{
								if ( this.variation === target_raw[i].variation ) // Vertical combining is only for equal rows
								if ( ( target_raw[i].matter_max / ( 1 + target_raw[i].variation ) / ( 1 + target_raw[i].yvariation ) ) === ( this.matter_max / ( 1 + this.variation ) / ( 1 + this.yvariation ) ) ) // Is it the same colour?
								if ( sdWorld.CheckLineOfSight( this.x, this.y, target_raw[ i ].x, target_raw[ i ].y, target_raw[ i ], [ 'sdMatterContainer' ], [ 'sdBlock', 'sdDoor' ] ) )
								{
									target_raw[i].yvariation += 1 + this.yvariation;
									target_raw[i].matter_max += this.matter_max;
									target_raw[i].matter += this.matter;
									target_raw[i]._hmax += this._hmax;
									target_raw[i]._hea += this._hea;
									target_raw[i].y = target_raw[i].y + ( 16 * ( 1 + this.yvariation ) );
									this.matter = 0;
									this.remove();
									break;
								}
							}
						}
					}
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.variation === 0 && this.yvariation === 0 )
		sdEntity.Tooltip( ctx, "Matter container ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
		else
		sdEntity.Tooltip( ctx, "Matter containers ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
		if (this.yvariation === 0 || this.yvariation === 2 || this.yvariation === 4 )
		{

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16, 32, 32 );
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16, 32, 32 );
			}
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max / ( (1 + this.variation ) * ( 1 + this.yvariation ) ) );
	
		ctx.globalAlpha = this.matter / this.matter_max;

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16, 32, 32 );
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16, 32, 32 );
			}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		}
		if (this.yvariation > 0 )
		{

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 - ( 16 * this.yvariation ), 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max / ( (1 + this.variation ) * ( 1 + this.yvariation ) ) );
	
		ctx.globalAlpha = this.matter / this.matter_max;

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 - ( 16 * this.yvariation ), 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 - ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 + ( 16 * this.yvariation ), 32, 32 );
			}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		}
		if (this.yvariation === 3 )
		{

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 + 16, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 - 16, 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 + 16, 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 + 16, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 + 16, 32, 32 );
			}
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max / ( (1 + this.variation ) * ( 1 + this.yvariation ) ) );
	
		ctx.globalAlpha = this.matter / this.matter_max;

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 + 16, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 - 16, 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 + 16, 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 + 16, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 - 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 + 16, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 + 16, 32, 32 );
			}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		}
		if (this.yvariation === 4 )
		{

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 12 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 12 * this.variation ), - 16 + 32, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 - 32, 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16, - 16 + 32, 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 4 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 4 * this.variation ), - 16 + 32, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 - ( 6 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 16 + ( 6 * this.variation ), - 16 + 32, 32, 32 );
			}
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max / ( (1 + this.variation ) * ( 1 + this.yvariation ) ) );
	
		ctx.globalAlpha = this.matter / this.matter_max;

			if ( this.variation > 0 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 12 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 12 * this.variation ), - 16 + 32, 32, 32 );
			}
			if ( this.variation === 0 || this.variation === 2 || this.variation === 4 )
			{
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 - 32, 32, 32 );
			ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16, - 16 + 32, 32, 32 );
			}
			if ( this.variation === 3 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 4 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 4 * this.variation ), - 16 + 32, 32, 32 );
			}
			if ( this.variation === 4 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 - 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 - ( 6 * this.variation ), - 16 + 32, 32, 32 );
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 16 + ( 6 * this.variation ), - 16 + 32, 32, 32 );
			}
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._hea <= 0 ) // Is it destroyed by HP or when merging with other container?
		{
			sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
			
			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 40
			);
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		
		return this._hmax * sdWorld.damage_to_matter + this.matter;
	}
}
//sdMatterContainer.init_class();

export default sdMatterContainer;