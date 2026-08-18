import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@memo-ai/notes';
const DEMO_TRANSCRIPT = '今天和产品团队讨论了移动端 AI 助手的第一版方案。我们决定优先完成离线语音转写、会议摘要和待办事项提取。周五前完成交互原型，下周安排真机测试。';

const seedNotes = [
  { id: 'seed-1', title: '产品讨论 · AI 助手', createdAt: '今天 10:32', duration: '00:42', transcript: DEMO_TRANSCRIPT, summary: '团队确定了 AI 助手 MVP：离线转写、自动摘要与待办提取。', todos: ['周五前完成交互原型', '下周安排真机测试'], tags: ['产品', 'AI'] },
  { id: 'seed-2', title: '课程灵感', createdAt: '昨天 19:08', duration: '01:18', transcript: '可以做一个语音笔记 App，把课堂里的重点自动变成复习清单。', summary: '将课堂语音自动整理成可复习的任务清单。', todos: ['画出信息架构'], tags: ['学习'] }
];

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function App() {
  return <SafeAreaProvider><AppContent /></SafeAreaProvider>;
}

function AppContent() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [notes, setNotes] = useState(seedNotes);
  const [tab, setTab] = useState('home');
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then(value => value && setNotes(JSON.parse(value))).catch(() => {}); }, []);
  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() => {}); }, [notes]);

  const recording = recorderState.isRecording;
  const duration = Math.round((recorderState.durationMillis || 0) / 1000);
  const allTags = useMemo(() => ['全部', ...new Set(notes.flatMap(note => note.tags))], [notes]);
  const filteredNotes = useMemo(() => notes.filter(n => {
    const matchesQuery = `${n.title}${n.transcript}${n.tags.join('')}`.toLowerCase().includes(query.toLowerCase());
    const matchesTag = tagFilter === '全部' || n.tags.includes(tagFilter);
    return matchesQuery && matchesTag;
  }), [notes, query, tagFilter]);
  const totalMinutes = useMemo(() => notes.reduce((sum, note) => sum + Math.max(1, parseInt(note.duration.slice(0, 2), 10) || 0), 0), [notes]);

  async function toggleRecording() {
    if (recording) {
      await recorder.stop();
      setProcessing(true);
      setTimeout(() => {
        const note = { id: String(Date.now()), title: '新语音笔记', createdAt: '刚刚', duration: formatTime(duration || 8), transcript: DEMO_TRANSCRIPT, summary: '已自动提炼本次讨论的 MVP 范围和两个后续行动。', todos: ['周五前完成交互原型', '下周安排真机测试'], tags: ['AI', '会议'] };
        setNotes(current => [note, ...current]);
        setProcessing(false); setSelected(note); setTab('detail');
      }, 1500);
      return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) { Alert.alert('需要麦克风权限', '请允许访问麦克风后再录音。'); return; }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  function openNote(note) { setSelected(note); setTab('detail'); }
  function renderNote({ item }) { return <Pressable style={styles.noteCard} onPress={() => openNote(item)}><View style={styles.noteTop}><View style={styles.icon}><Text>✦</Text></View><View style={styles.noteMain}><Text style={styles.noteTitle}>{item.title}</Text><Text style={styles.noteMeta}>{item.createdAt} · {item.duration}</Text></View></View><Text style={styles.noteSummary}>{item.summary}</Text><View style={styles.previewBlock}><Text style={styles.previewLabel}>转写预览</Text><Text numberOfLines={2} style={styles.previewText}>{item.transcript}</Text></View><View style={styles.tags}>{item.tags.map(t => <Text key={t} style={styles.tag}>{t}</Text>)}</View></Pressable>; }

  if (tab === 'detail' && selected) return <SafeAreaView style={styles.container}><StatusBar style="dark" /><View style={styles.detailHeader}><Pressable onPress={() => setTab('home')}><Text style={styles.back}>‹ 笔记</Text></Pressable><Text style={styles.headerTitle}>AI 整理结果</Text><Text style={styles.more}>•••</Text></View><View style={styles.detail}><Text style={styles.detailTitle}>{selected.title}</Text><Text style={styles.noteMeta}>{selected.createdAt} · {selected.duration}</Text><Section title="AI 摘要"><Text style={styles.summaryText}>{selected.summary}</Text></Section><Section title="行动事项">{selected.todos.map((todo, i) => <View key={todo} style={styles.todo}><View style={styles.checkbox}><Text>{i + 1}</Text></View><Text style={styles.todoText}>{todo}</Text></View>)}</Section><Section title="原始转写"><Text style={styles.transcript}>{selected.transcript}</Text></Section></View></SafeAreaView>;

  return <SafeAreaView style={styles.container}><StatusBar style="dark" /><View style={styles.header}><Text style={styles.brand}>Memo <Text style={styles.brandAccent}>AI</Text></Text><Text style={styles.avatar}>林</Text></View><View style={styles.hero}><Text style={styles.eyebrow}>SPEAK, THEN THINK CLEARLY</Text><Text style={styles.heroTitle}>把语音，变成行动。</Text><Text style={styles.heroText}>录下灵感，AI 自动转写、总结并提取待办。</Text></View><View style={styles.statsRow}><View style={styles.statCard}><Text style={styles.statValue}>{notes.length}</Text><Text style={styles.statLabel}>条语音笔记</Text></View><View style={styles.statCard}><Text style={styles.statValue}>{totalMinutes}</Text><Text style={styles.statLabel}>分钟录音</Text></View><View style={styles.statCard}><Text style={styles.statValue}>{notes.filter(note => note.todos.length).length}</Text><Text style={styles.statLabel}>条待办提取</Text></View></View><Pressable style={[styles.recordButton, recording && styles.recording]} onPress={toggleRecording}><View style={styles.recordDot}>{recording ? <Text style={styles.stop}>■</Text> : <Text style={styles.mic}>⌁</Text>}</View><View><Text style={styles.recordLabel}>{recording ? '正在录音' : processing ? 'AI 正在整理…' : '开始一条语音笔记'}</Text><Text style={styles.recordTime}>{recording ? formatTime(duration) : processing ? '转写 · 摘要 · 待办' : '点击即可开始'}</Text></View></Pressable><View style={styles.filterRow}>{allTags.map(tag => <Pressable key={tag} onPress={() => setTagFilter(tag)} style={[styles.filterChip, tagFilter === tag && styles.filterChipActive]}><Text style={[styles.filterChipText, tagFilter === tag && styles.filterChipTextActive]}>{tag}</Text></Pressable>)}</View><View style={styles.listHeader}><Text style={styles.listTitle}>最近笔记</Text><Text style={styles.count}>{filteredNotes.length} 条</Text></View><TextInput value={query} onChangeText={setQuery} placeholder="搜索标题、转写或标签" placeholderTextColor="#8B8CA3" style={styles.search} /><FlatList data={filteredNotes} renderItem={renderNote} keyExtractor={item => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyTitle}>没有匹配的笔记</Text><Text style={styles.emptyText}>换个关键词，或者清空标签筛选试试。</Text></View>} /><View style={styles.tabbar}><Text style={styles.tabActive}>▣  笔记</Text><Text style={styles.tab}>⌕  搜索</Text><Text style={styles.tab}>◷  我的</Text></View></SafeAreaView>;
}

function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#FAFAFC'}, header:{paddingHorizontal:24,paddingTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, brand:{fontSize:23,fontWeight:'800',color:'#17172B'},brandAccent:{color:'#6C5CE7'},avatar:{backgroundColor:'#E8E5FF',color:'#5748CC',fontWeight:'700',padding:8,borderRadius:20},hero:{paddingHorizontal:24,paddingTop:30,paddingBottom:18},eyebrow:{fontSize:10,letterSpacing:1.4,color:'#8173E8',fontWeight:'700'},heroTitle:{fontSize:30,fontWeight:'800',color:'#18182A',marginTop:8},heroText:{fontSize:14,color:'#747487',marginTop:7,lineHeight:21},statsRow:{flexDirection:'row',gap:10,paddingHorizontal:20,marginBottom:8},statCard:{flex:1,backgroundColor:'white',borderWidth:1,borderColor:'#EEEFF5',borderRadius:16,paddingVertical:14,paddingHorizontal:12},statValue:{fontSize:20,fontWeight:'800',color:'#222233'},statLabel:{fontSize:11,color:'#7B7B8A',marginTop:4},recordButton:{marginHorizontal:20,borderRadius:20,padding:18,backgroundColor:'#6C5CE7',flexDirection:'row',alignItems:'center',gap:14,shadowColor:'#5143C7',shadowOpacity:.2,shadowRadius:14,elevation:4},recording:{backgroundColor:'#F0526A'},recordDot:{width:47,height:47,borderRadius:24,backgroundColor:'rgba(255,255,255,.18)',alignItems:'center',justifyContent:'center'},mic:{color:'white',fontSize:29,fontWeight:'700'},stop:{color:'white',fontSize:18},recordLabel:{color:'white',fontSize:16,fontWeight:'700'},recordTime:{color:'rgba(255,255,255,.75)',fontSize:12,marginTop:3},filterRow:{paddingHorizontal:20,paddingTop:16,paddingBottom:2,flexDirection:'row',flexWrap:'wrap',gap:8},filterChip:{backgroundColor:'white',borderWidth:1,borderColor:'#E8E8F2',borderRadius:999,paddingHorizontal:12,paddingVertical:8},filterChipActive:{backgroundColor:'#6C5CE7',borderColor:'#6C5CE7'},filterChipText:{fontSize:12,color:'#525269',fontWeight:'700'},filterChipTextActive:{color:'white'},listHeader:{marginTop:18,paddingHorizontal:24,flexDirection:'row',justifyContent:'space-between'},listTitle:{fontSize:18,fontWeight:'800',color:'#232334'},count:{color:'#9897A6',fontSize:13,paddingTop:4},search:{marginHorizontal:20,marginTop:12,backgroundColor:'#F0F0F5',borderRadius:12,paddingHorizontal:15,paddingVertical:11,fontSize:14,color:'#232334'},list:{padding:20,paddingTop:10,paddingBottom:75},noteCard:{backgroundColor:'white',borderWidth:1,borderColor:'#EEEEF3',borderRadius:16,padding:15,marginBottom:11},noteTop:{flexDirection:'row',alignItems:'center'},icon:{width:35,height:35,backgroundColor:'#E9E6FF',borderRadius:11,alignItems:'center',justifyContent:'center'},noteMain:{marginLeft:10,flex:1},noteTitle:{fontSize:15,fontWeight:'700',color:'#29293A'},noteMeta:{fontSize:12,color:'#9393A1',marginTop:3},noteSummary:{fontSize:13,color:'#666677',lineHeight:19,marginTop:12},previewBlock:{marginTop:12,backgroundColor:'#FAF8FF',borderRadius:12,padding:12,borderWidth:1,borderColor:'#EEE9FF'},previewLabel:{fontSize:11,fontWeight:'800',letterSpacing:.5,color:'#7C62E5',marginBottom:6},previewText:{fontSize:13,color:'#5C5C6D',lineHeight:18},tags:{flexDirection:'row',gap:6,marginTop:12},tag:{fontSize:11,color:'#6758C9',backgroundColor:'#F0EEFF',paddingHorizontal:8,paddingVertical:4,borderRadius:8},emptyState:{paddingVertical:26,alignItems:'center'},emptyTitle:{fontSize:15,fontWeight:'800',color:'#2C2C3A'},emptyText:{fontSize:13,color:'#777786',marginTop:6,textAlign:'center'},tabbar:{height:62,backgroundColor:'white',borderTopWidth:1,borderTopColor:'#EEEEF3',position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},tab:{fontSize:12,color:'#A2A2AF'},tabActive:{fontSize:12,color:'#6758D4',fontWeight:'700'},detailHeader:{padding:20,paddingTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},back:{fontSize:15,color:'#6758D4',fontWeight:'700'},headerTitle:{fontSize:15,fontWeight:'700',color:'#29293A'},more:{color:'#747487'},detail:{paddingHorizontal:24},detailTitle:{fontSize:25,fontWeight:'800',color:'#222233',marginTop:15},section:{marginTop:28},sectionTitle:{fontSize:13,fontWeight:'800',color:'#6758D4',letterSpacing:.6,marginBottom:10},summaryText:{fontSize:16,color:'#343444',lineHeight:25,backgroundColor:'#F0EEFF',padding:15,borderRadius:14},todo:{flexDirection:'row',alignItems:'center',marginBottom:12},checkbox:{width:24,height:24,borderRadius:12,backgroundColor:'#E9E6FF',alignItems:'center',justifyContent:'center',marginRight:10},todoText:{fontSize:15,color:'#3C3C4C'},transcript:{fontSize:15,color:'#686879',lineHeight:25}
});
