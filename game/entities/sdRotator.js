import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdTask from './sdTask.js';
import sdCube from './sdCube.js';

class sdRotator extends sdEntity
{
	static init_class()
	{
		sdRotator.img_rotator = sdWorld.CreateImageFromFile( 'sdRotator' ); // Cube disc by The Commander

        sdRotator.TYPE_CUBE_DISC = 0;
        sdRotator.TYPE_CUBE_SHELL = 1;
        
        sdRotator.ignored_entity_classes = [ 'sdGib', 'sdRotator' ];
        sdRotator.disallowed_dmg_entities = [ 'sdBlock', 'sdDoor', 'sdGun', 'sdCube', 'sdRift', 'sdRotator', 'sdBullet' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === sdRotator.TYPE_CUBE_DISC ? -13 : this.type === sdRotator.TYPE_CUBE_SHELL ? -10 : -32; }
	get hitbox_x2() { return this.type === sdRotator.TYPE_CUBE_DISC ? 13 : this.type === sdRotator.TYPE_CUBE_SHELL ? 10 : 32; }
	get hitbox_y1() { return this.type === sdRotator.TYPE_CUBE_DISC ? -13 : this.type === sdRotator.TYPE_CUBE_SHELL ? -10 : -32; }
	get hitbox_y2() { return this.type === sdRotator.TYPE_CUBE_DISC ? 13 : this.type === sdRotator.TYPE_CUBE_SHELL ? 10 : 32; }
	
	get hard_collision() // For world geometry where players can walk
	{ return !!this.owner; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

        this.type = params.type;
        this.tier = params.tier;
		
		this.hea = this.hmax = this.type === sdRotator.TYPE_CUBE_DISC ? 1500 : 750;
        
        this.owner = params.owner;

        this.flip_rotation = params.flip_rotation ?? 1;
        this.orbit_speed = ( params.orbit_speed ?? this.type === sdRotator.TYPE_CUBE_DISC ? 0.025 : this.type === sdRotator.TYPE_CUBE_SHELL ? 0 : 0.01 ) * this.flip_rotation * 100;
        this.orbit_distance = params.orbit_distance ?? this.type === sdRotator.TYPE_CUBE_DISC ? 26 : this.type === sdRotator.TYPE_CUBE_SHELL ? 16 : 32;
		this.orbit_angle = params.orbit_angle * 100 ?? 0; // Can be also used as start offset

        this.angle = 0; // For visuals
        
        this.disabled = false;
        this._ttl = 300;
        
        this._damage = params.damage ?? this.type === sdRotator.TYPE_CUBE_DISC ? 10 : 0;
        
        this.regen_timeout = 0;
        this.attack_anim = 0;
        
        if ( this.owner )
        {
            const target_x = this.owner.x + Math.cos( this.orbit_angle ) * this.orbit_distance;
            const target_y = this.owner.y + Math.sin( this.orbit_angle ) * this.orbit_distance;
            
            this.x = target_x;
            this.y = target_y;

            this.angle = Math.atan2( this.y - this.owner.y, this.x - this.owner.x ) - ( Math.PI / 4 );
            this.angle *= 100;
        }

        this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
	}
    CollisionFiltering( from_entity )
	{
		return ( this.owner !== from_entity );
	}
    GetIgnoredEntityClasses()
    {
        return sdRotator.ignored_entity_classes;
    }
    get mass()
    {
        return 50;
    }
    ExtraSerialzableFieldTest( prop )
	{
		return ( prop === 'owner' );
	}
	Impact( vel ) // fall damage basically
	{
        // No fall dmg
	}
	Impulse( x, y )
	{
        if ( this.owner ) return this.owner.Impulse( x, y );

		this.sx += x * 0.05;
		this.sy += y * 0.05;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
    
        if ( dmg > 0 )
        this.regen_timeout = 30;
    
        if ( initiator )
		{
			if ( !initiator.IsPlayerClass() )
			if ( ( initiator.owner || initiator._owner ) )
			initiator = ( initiator.owner || initiator._owner );
			
			if ( initiator.IsPlayerClass() )
			{
				initiator._nature_damage += dmg * 8;
			}
		}

		this.hea -= dmg;
        this.hea = Math.min( this.hea, this.hmax ); // Prevent overhealing

		if ( this.hea <= 0 )
		{
            sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
			sdSound.PlaySound({ name:'gun_needle', x:this.x, y:this.y, volume:4, pitch: 0.2 });
            sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:30,
				damage_scale: 2, // 5 was too deadly on relatively far range
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#33FFFF',
				no_smoke: true,
				shrapnel: true
			});

            this.DropLoot( this.type, this.tier );

			this.remove();
		}
	}
    onThink( GSPEED )
    {
        if ( sdWorld.is_server )
        {
            if ( this.owner )
            {
                if ( this.owner.is( sdCube ) )
                {
                    this.attack_anim = this.owner.attack_anim;
                }
            }
            if ( !this.owner || this.owner._is_being_removed || ( this.owner.hea || this.owner._hea ) <= 0 )
            {
                this.owner = null;
                this.disabled = true;
            }
            if ( this.regen_timeout > 0 )
            this.regen_timeout -= GSPEED;
            else
            {
                if ( this.hea < this.hmax )
                {
                    this.hea = Math.min( this.hea + GSPEED, this.hmax );
                }
            }
        }
        if ( this.disabled )
        {
            this.sy += sdWorld.gravity * GSPEED;
            this.angle += this.sx / 2;

            this._ttl--;
            if ( this._ttl <= 0 )
            {
                this.Damage( 10_000 );
            }
        }
        this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );
    }
	Spin( GSPEED ) // Separate from onThink, so it can keep its allignment even when hibernated
	{
        this.PhysWakeUp();
        //if ( sdWorld.is_server )
        {
            if ( this.owner && !this.owner._is_being_removed )
            {
                const target_x = this.owner.x + Math.cos( this.orbit_angle / 100 ) * this.orbit_distance;
                const target_y = this.owner.y + Math.sin( this.orbit_angle / 100 ) * this.orbit_distance;

                this.x = target_x
                this.y = target_y

                if ( ( this.owner.hea || this.owner._hea ) > 0 )
                this.orbit_angle += 100 * ( this.orbit_speed / 100 ) * GSPEED;

                this.angle = Math.atan2( this.y - this.owner.y, this.x - this.owner.x ) - ( Math.PI / 4 );
                this.angle *= 100;
                this.sx = this.sy = 0;
            } 
        }
	}
    
    onMovementInRange( from_entity )
    {
        if ( this.disabled ) return;
        
        if ( this._damage <= 0 ) return;
        
        if ( from_entity === this.owner ) return;

        if ( from_entity._owner === this ) return;
        
        if ( sdRotator.disallowed_dmg_entities.includes( from_entity.GetClass() )) return;
        
        if ( from_entity.is_static ) return;
        
        if ( from_entity.IsBGEntity() ) return;
        
        if ( !from_entity.IsTargetable() ) return;

        from_entity.DamageWithEffect( this._damage, this.owner );

        from_entity.Impulse( Math.cos( this.angle / 100 ) * Math.abs( this._damage ) * 10, Math.sin( this.angle / 100 ) * Math.abs( this._damage ) * 10 );
        sdWorld.SendEffect({ x: from_entity.x, y: from_entity.y, type: from_entity.GetBleedEffect(), filter: from_entity.GetBleedEffectFilter(), hue: from_entity.GetBleedEffectHue() })
        
    }
    DropLoot( type, tier )
    {
        if ( type === sdRotator.TYPE_CUBE_DISC || type === sdRotator.TYPE_CUBE_SHELL )
        {
            setTimeout(() => {
                const probability_armor = type === sdRotator.TYPE_CUBE_SHELL ? 0.15 : 0.05;
                const random = Math.random();
                
                const x = this.x;
                const y = this.y;
                const sx = this.sx;
                const sy = this.sy;

                if ( random < probability_armor )
                {
                    const gun = new sdGun({ x: x, y: y, class: sdGun.CLASS_CUBE_ARMOR });
                    gun.sx = sx;
                    gun.sy = sy;

                    sdCube.ColorGunAccordingly( gun, tier );
                }
                
                if ( Math.random() > 0.25 ) // Cube shard chance too?
                {
                    const shard = new sdGun({ x: x, y: y, class: sdGun.CLASS_CUBE_SHARD });
                    shard.sx = sx;
                    shard.sy = sy;

                    sdCube.ColorGunAccordingly( shard, tier );
                }
            }, 500 )
        }
    }
    GetFilter()
    {
        if ( this.type === sdRotator.TYPE_CUBE_DISC || this.type === sdRotator.TYPE_CUBE_SHELL )
        {
            if ( this.tier === sdCube.KIND_YELLOW )
			{
				return sdCube.huge_filter;
			}

			if ( this.tier === sdCube.KIND_WHITE )
			{
				return sdCube.white_filter;
			}

			if ( this.tier === sdCube.KIND_PINK )
			{
                return sdCube.pink_filter;
			}

			if ( this.tier === sdCube.KIND_GREEN )
			{
				return sdCube.green_filter;
			}
			if ( this.tier === sdCube.KIND_BLUE )
			{
				return sdCube.blue_filter;
			}
			if ( this.tier === sdCube.KIND_ANCIENT )
			{
				return sdCube.ancient_filter;
			}
			if ( this.tier === sdCube.KIND_RED )
			{
				return sdCube.red_filter;
			}
            if ( this.tier === sdCube.KIND_PURPLE )
			{
				return sdCube.purple_filter;
			}
        }
        return null;
    }
	DrawHUD( ctx, attached ) // foreground layer
	{
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
        // if ( this.disabled || attached )
        {
            ctx.rotate ( this.angle / 100 );
            ctx.sd_filter = this.GetFilter();

            let xx = 0;
            let yy = 0;

            if ( this.type === sdRotator.TYPE_CUBE_DISC )
            {
                yy = 0;
                ctx.scale( 1.5, 1.5 );
            }
            if ( this.type === sdRotator.TYPE_CUBE_SHELL )
            {
                yy = 1;
                const scale = 20 / 14;
                ctx.scale( scale, scale );
            }

            if ( this.disabled )
            xx = 1;
            else if ( this.attack_anim > 0 )
            xx = 3;
            else if ( this.regen_timeout > 15 )
            xx = 2;
            ctx.drawImageFilterCache( sdRotator.img_rotator, 32 * xx, 32 * yy, 32,32, -16, -16, 32,32 );

            ctx.sd_filter = null;
        }
	}
    
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
}
export default sdRotator;
