# python3 mix.py a|b → audio-a.wav / audio-b.wav (hudba + zvuky pohybu, -14 LUFS)
import subprocess, sys
S='../work4/sfx/'; A='/home/user/opice-new/assets/sounds/'; I='/home/user/monkey/.claude/skills/brag/assets/sfx/impact/'
which=sys.argv[1]
if which=='a':
    b=60/110; B=lambda n:n*b; L=30; music=('music-a.wav',.55)
    ev=[(S+'item_select.mp3',.12,.35),(S+'glass_tap_sparkle_1.mp3',B(1),.3,(0,1.3)),(S+'sand_pour_1.mp3',B(1)+.05,.45,(1.3,1.35)),(S+'swish.wav',B(1),.4),
        (S+'boom.wav',B(4),.9),(I+'impactPlate_heavy_001.ogg',B(4),.9),(A+'snap.wav',B(4),.8),(S+'glass_tap_sparkle_1.mp3',B(4)+.05,.25,(0,1.4)),
        (S+'soft_whoosh.mp3',B(5.5)-.15,.7),(S+'swipe_effect.mp3',B(7.5)-.1,.5),(S+'success_bling.mp3',B(8),.55),(A+'pop.wav',B(8),.4),
        (S+'swish.wav',B(10)-.2,.6),(S+'soft_whoosh.mp3',B(10)-.35,.6),
        *[(S+'pop_open.mp3',B(n),.6) for n in (12,13,14)],
        (S+'soft_whoosh.mp3',B(17)-.3,.7),(S+'swipe_effect.mp3',B(20)-.05,.5),(S+'toggle_on.mp3',B(21.5),.5),
        *[(S+'hit.mp3',B(n),.6) for n in range(24,30)],*[(S+'swish.wav',B(n)-.1,.3) for n in range(24,30)],
        (S+'upward_swoosh.mp3',B(30)-.95,.7),(S+'level_up.mp3',B(32)-.62,.55),(A+'level-up.wav',B(32),.5),(S+'boom.wav',B(32),.45),
        (S+'soft_whoosh.mp3',B(35)-.3,.6),
        (S+'swish.wav',B(38),.5),(S+'swish.wav',B(38)+.15,.4),(S+'panel_expand.mp3',B(39),.4),
        (S+'gentle_whoosh.mp3',B(45)+.35-.97,.7),(S+'item_select.mp3',B(46),.3),
        (S+'sand_pour_1.mp3',B(47),.5,(1.2,.9)),(S+'glass_tap_sparkle_1.mp3',B(47),.3,(0,1.8)),
        (S+'crystal_glass_clink.mp3',B(51),.6),(A+'success.wav',B(51),.4)]
else:
    b=60/140; B=lambda n:n*b; L=20; music=('music-b.wav',.6)
    ev=[(S+'swish.wav',B(3.6),.5),(S+'boom.wav',B(4),1.0),(I+'impactPunch_heavy_000.ogg',B(4),.9),
        *[(S+'swish.wav',B(n)-.08,.5) for n in (6,10,16,20,34,37)],
        (S+'pop_open.mp3',B(11),.6),(S+'pop_open.mp3',B(12),.6),
        (S+'tab_close.mp3',B(14),.6),(S+'swipe_effect.mp3',B(14.2),.5),
        (S+'boom.wav',B(17),.8),(I+'impactPlate_heavy_001.ogg',B(17),.9),(A+'snap.wav',B(17),.7),(S+'coin_bling.mp3',B(17.5),.6),
        (S+'level_up.mp3',B(22)-.62,.6),(S+'power_up.mp3',B(22),.4),
        *[(S+'hit.mp3',B(n),.6) for n in range(26,34)],
        (S+'boom.wav',B(40),.9),(I+'impactPunch_heavy_000.ogg',B(40),.8),*[(A+'pop.wav',B(40+i*.5),.5) for i in range(5)],
        (S+'jump.mp3',B(43),.6),(S+'success_bling.mp3',B(44.5),.6)]
args=['ffmpeg','-y','-v','error','-i',music[0]];flt=[f'[0:a]volume={music[1]}[m]'];mix='[m]'
for i,e in enumerate(ev,1):
    f,t,v=e[:3];args+=['-i',f]
    tr=f'atrim={e[3][0]}:{e[3][0]+e[3][1]},asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st={e[3][1]-0.25}:d=0.25,' if len(e)>3 else ''
    ms=int(max(0,t)*1000)
    flt.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,{tr}volume={v},adelay={ms}|{ms}[s{i}]');mix+=f'[s{i}]'
flt.append(f'{mix}amix=inputs={len(ev)+1}:normalize=0,atrim=0:{L},afade=t=out:st={L-0.6}:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11[a]')
subprocess.run(args+['-filter_complex',';'.join(flt),'-map','[a]','-ar','48000',f'audio-{which}.wav'],check=True);print('ok',len(ev))
