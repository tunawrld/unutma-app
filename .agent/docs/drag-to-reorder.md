# Görev Sıralama Özelliği (Drag to Reorder)

## Genel Bakış

Unutma App'e görevleri sürükleyerek yeniden sıralama özelliği eklendi. Bu özellik sayesinde görevlerinizi dikey olarak (yukarı/aşağı) hareket ettirerek istediğiniz sıraya koyabilirsiniz.

## Nasıl Kullanılır

### Sürükleme Başlatma
1. Bir görevin **sol tarafındaki menü ikonuna** (☰) uzun basın (150ms)
2. İkon yeşil renge dönüşecek ve görev sürüklenebilir hale gelecek

### Sürükleme
- Parmağınızı yukarı/aşağı hareket ettirerek görevi istediğiniz konuma getirin
- Görev sürüklenirken hafif transparan olur ve yeşil bir çerçeve görünür
- Diğer görevler otomatik olarak yer değiştirecek

### Bırakma
- Parmağınızı kaldırdığınızda görev yeni konumuna yerleşir
- Hafif bir haptic feedback (titreşim) hissedilir

## Teknik Detaylar

### Kullanılan Teknolojiler
- `react-native-draggable-flatlist` - Sürükle-bırak listesi için
- `react-native-reanimated` - Akıcı animasyonlar için
- `react-native-gesture-handler` - Gelişmiş jest algılama için

### Önemli Özellikler

#### Yatay Kaydırma ile Uyumluluk
- Sürükleme özelliği **dikey hareket** algılar
- Yatay kaydırma (günler arası geçiş) **etkilenmez**
- `activationDistance: 5px` ile hassas kontrol
- `dragHitSlop` ile yatay tolerans artırıldı

#### Performans
- Görev sırası `createdAt` timestamp'i ile saklanır
- Tüm değişiklikler AsyncStorage'a otomatik kaydedilir
- Sadece değişen görevler güncellenir

#### Görsel Feedback
- **Sürüklerken**: Opacity %70, yeşil çerçeve
- **Drag Handle**: Menü ikonu, basıldığında yeşil
- **ScaleDecorator**: Smooth scale animasyonu

## Kod Yapısı

### Store (taskStore.ts)
```typescript
reorderTasks(date: string, orderedTasks: Task[]): void
```
Belirtilen tarihteki görevlerin sırasını günceller.

### DayView Component
- `DraggableFlatList` kullanır
- `onDragEnd` callback'inde `reorderTasks` çağırır
- Haptic feedback sağlar

### TaskItem Component
- `onDrag` prop'u drag handler olarak kullanılır
- `isDragging` prop'u ile görsel durum kontrolü
- Sol tarafta drag handle ikonu

## Sınırlamalar

1. **Tek günlük sıralama**: Görevler sadece kendi günü içinde yeniden sıralanabilir
2. **Horizontal scroll**: Yatay kaydırma ile drag çakışmaması için dikkatle tasarlandı
3. **Edit mode**: Görev düzenleme modundayken sürükleme pasif

## Gelecek İyileştirmeler

- [ ] Görevleri farklı günlere taşıma
- [ ] Çoklu görev seçimi ve toplu hareket
- [ ] Kategorilere göre otomatik sıralama
- [ ] Sürüklerken görsel önizleme iyileştirme
