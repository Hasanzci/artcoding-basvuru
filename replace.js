const fs = require('fs');
const path = require('path');

const filesToProcess = ['index.html', 'tesekkurler.html', 'admin.html'];

for (const file of filesToProcess) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Meta & Menü & Header
  content = content.replace(/LGS Matematik kurslarımıza/g, 'LGS Matematik içeriklerimize');
  content = content.replace(/href="#kurslar">Kurslar<\/a>/g, 'href="#icerikler">İçerikler</a>');
  content = content.replace(/doğru kursu bulmanıza/g, 'doğru içeriği bulmanıza');
  content = content.replace(/Ücretsiz Ders/g, 'Ücretsiz Dene');
  content = content.replace(/Farklı kurs/g, 'Farklı modül');
  content = content.replace(/Ücretsiz deneme dersi/g, 'Ücretsiz deneme erişimi');
  content = content.replace(/ilgi çekici dersler:/g, 'ilgi çekici dijital içerikler:');

  // Courses section
  content = content.replace(/id="kurslar"/g, 'id="icerikler"');
  content = content.replace(/Haziran döneminde açılan kurslar/g, 'Haziran döneminde sunulan dijital içerikler');
  content = content.replace(/proje tabanlı dersler/g, 'proje tabanlı uygulamalar');
  content = content.replace(/Öğrenci Kursu/g, 'Öğrenci İçeriği');
  content = content.replace(/LGS Matematik \(Birebir Özel Ders\)/g, 'LGS Matematik (Özel İçerik Modülü)');
  content = content.replace(/LGS Matematik <br><span style="font-size: 0.85rem; color: #E91E63; font-weight: 800;">\(1-1 Özel Ders\)<\/span>/g, 'LGS Matematik <br><span style="font-size: 0.85rem; color: #E91E63; font-weight: 800;">(Özel İçerik Modülü)</span>');
  content = content.replace(/birebir \(1-1\) eğitim!/g, 'bireyselleştirilmiş içerik deneyimi!');
  content = content.replace(/birebir \(1-1\) eğitim programıyla/g, 'birebir mentorluk destekli içerik programıyla');
  content = content.replace(/Grup dersi kalabalığı yok/g, 'Grup kalabalığı yok');
  content = content.replace(/canlı dersler/g, 'canlı oturumlar');

  // Platform section
  content = content.replace(/ArtCoding Akademi Online Platformu/g, 'ArtCoding Dijital İçerik Platformu');
  content = content.replace(/Kursumuza katılan/g, 'Platforma katılan');
  content = content.replace(/Ders İçerikleri ve Kayıtlar/g, 'Etkileşimli İçerikler');
  content = content.replace(/Kaçırılan dersleri tekrar izleme/g, 'Kaçırılan oturumları tekrar izleme');
  content = content.replace(/eğitim materyallerine/g, 'dijital materyallere');
  content = content.replace(/eğitmenlerden doğrudan/g, 'mentorlardan doğrudan');
  content = content.replace(/Kurs Kazanımları/g, 'Kazanımlar');
  content = content.replace(/Ücretsiz Deneme Dersi Fırsatıyla/g, 'Ücretsiz Deneme Erişimi Fırsatıyla');

  // Neden biz
  content = content.replace(/Eğitimde sanatla teknolojinin/g, 'Sanatla teknolojinin');
  content = content.replace(/Uzman Eğitmenler/g, 'Uzman Mentorlar');
  content = content.replace(/öğretmenler\./g, 'rehberler.');

  // Form
  content = content.replace(/Ücretsiz deneme dersi imkânı/g, 'Ücretsiz deneme erişimi imkânı');
  content = content.replace(/Esnek ders saatleri/g, 'Esnek kullanım saatleri');
  content = content.replace(/Hangi kursa başvuruyorsunuz\?/g, 'Hangi içeriğe başvuruyorsunuz?');
  content = content.replace(/Tercih ettiğiniz ders zamanı/g, 'Tercih ettiğiniz kullanım zamanı');
  content = content.replace(/Ücretsiz deneme dersi almak/g, 'Ücretsiz deneme erişimi almak');
  content = content.replace(/uygun kurs\/seviye/g, 'uygun modül/seviye');

  // FAQ
  content = content.replace(/Dersler hangi platformda işleniyor\?/g, 'Canlı oturumlar hangi platformda yapılıyor?');
  content = content.replace(/Tüm dersler Zoom üzerinden/g, 'Tüm oturumlar Zoom üzerinden');
  content = content.replace(/Deneme dersi ücretli mi\?/g, 'Deneme erişimi ücretli mi?');
  content = content.replace(/ilk deneme dersimiz tamamen/g, 'ilk deneme erişimimiz tamamen');
  content = content.replace(/Arduino kursu için/g, 'Arduino modülü için');

  // Footer & Modal
  content = content.replace(/online eğitim platformu/g, 'dijital içerik platformu');
  content = content.replace(/Deneme dersi planlamak/g, 'Deneme erişimi planlamak');
  
  // admin.html specific
  content = content.replace(/kurs tercihleri/g, 'içerik tercihleri');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
