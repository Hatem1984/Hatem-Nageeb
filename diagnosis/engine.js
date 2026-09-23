(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.DecisionLab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const AXES={
    customer:'مين بيشتري منك وليه؟',
    demand:'هل الناس فعلًا عايزة تشتري؟',
    economics:'الفلوس والأرقام عندك واضحة؟',
    execution:'هل الشغل بيتنفذ ويتسلّم كويس؟',
    decision:'عارف هتعمل إيه وإمتى تراجع؟'
  };
  const STAGES={idea:'فكرة / تحت التأسيس',running:'مشروع قائم'};
  const SCALE=[
    {value:0,label:'مش عارف / ما عنديش دليل واضح'},
    {value:1,label:'عندي انطباع أو حالات قليلة'},
    {value:2,label:'عندي تجربة أو أرقام لفترة محدودة'},
    {value:3,label:'عندي بيانات أو مواقف متكررة وبراجعها'}
  ];
  const QUICK_MAP={
    'عندي فكرة مشروع':'idea_validation',
    'التسعير':'pricing',
    'المبيعات':'sales',
    'السيولة والتحصيل':'cashflow',
    'التشغيل':'operations',
    'التكاليف':'cost_reduction',
    'التوسع':'expansion',
    'فتح فرع':'new_branch',
    'منتج أو خدمة جديدة':'new_product',
    'قرار آخر':'general_decision'
  };
  const DECISIONS={
    idea_validation:{label:'التأكد إن فكرة المشروع تستاهل تجربة صغيرة',keywords:['فكرة','ابدأ','ابدا','تستحق التنفيذ','مشروع جديد','تحت التاسيس'],confirm:'هل الناس عندها المشكلة فعلًا ومستعدة تاخد خطوة، قبل ما تصرف وقت أو فلوس كبيرة؟',noGo:'ما تجهزش المشروع كامل ولا تشتري أدوات قبل ما عميل مناسب يعمل خطوة حقيقية، مش بس يقول إن الفكرة حلوة.',cta:'شوف إزاي تختبر الفكرة داخل البرنامج',riskBias:3},
    pricing:{label:'تحديد السعر المناسب',keywords:['تسعير','سعر','اسعر','أُسعّر','ارفع السعر','أرفع السعر','سعري','غالي','رخيص','خصم'],confirm:'هل سعرك مناسب للي العميل بياخده ولتكلفة تنفيذ البيعة؟ وهل تقدر تجرّب تغييره على عدد قليل الأول؟',noGo:'ما تغيّرش السعر لكل العملاء قبل ما تعرف بيفضل لك كام من كل بيعة وتجرب السعر الجديد على عدد قليل.',cta:'شوف إزاي تحدد السعر وتعرف اللي بيفضل من كل بيعة',riskBias:2},
    cashflow:{label:'فهم ليه الفلوس مش متاحة رغم وجود مبيعات',keywords:['كاش','سيولة','تحصيل','قبض','مفيش فلوس','آخر الشهر','اخر الشهر','متاخر في الدفع','متأخر في الدفع'],confirm:'هل المشكلة بسبب تأخر فلوس العملاء، ولا إن المكسب من البيعة قليل، ولا إن المصاريف بتخرج بدري؟',noGo:'ما تزودش المبيعات أو الإعلان قبل ما تفرّق بين البيع والفلوس اللي دخلت فعلًا، وتعرف الفلوس بتدخل بعد كام يوم.',cta:'شوف إزاي البرنامج بيوضح الفلوس بتدخل إمتى وبتخرج إمتى',riskBias:5},
    sales:{label:'فهم ليه المهتمين مش بيشتروا',keywords:['مبيعات','بيع','مش ببيع','العملاء مش بتشتري','اقفال','إقفال','صفقات'],confirm:'هل المشكلة في اللي بتعرضه، ولا نوع الناس اللي بتكلمها، ولا خطوة معينة قبل الشراء؟',noGo:'ما تزودش مكالمات أو عروض البيع قبل ما تعرف فين بالضبط الناس بتقف ومابتكملش شراء.',cta:'شوف إزاي تشخّص مشكلة المبيعات داخل البرنامج',riskBias:2},
    marketing:{label:'فهم هل الإعلان بيجيب ناس مناسبة وبتشتري',keywords:['اعلان','إعلان','تسويق','حملة','ليدز','عملاء محتملين','تكلفة العميل'],confirm:'هل المشكلة إن إعلانك مش بيوصل للناس المناسبة، ولا رسالته مش واضحة، ولا المهتمين مش بيكملوا شراء؟',noGo:'ما تزودش ميزانية الإعلان قبل ما تعرف هل اللي جايين مناسبين، كام واحد اشترى فعلًا، وبيفضل لك كام من البيعة.',cta:'شوف إزاي تربط الإعلان بالشراء الحقيقي داخل البرنامج',riskBias:4},
    cost_reduction:{label:'تقليل المصاريف من غير ما الشغل يتضرر',keywords:['تكاليف','تكلفة','مصروفات','خفض','اوفر','أوفر','غالي عليا'],confirm:'إيه المصروف اللي تقدر تقلله من غير ما البيع أو الجودة أو التسليم يتأثر؟',noGo:'ما تقللش مصروف لمجرد إنه كبير؛ اتأكد الأول إنه مش بيحمي البيع أو الجودة أو التسليم.',cta:'شوف إزاي تقلل المصاريف من غير ما تضر الشغل',riskBias:3},
    operations:{label:'معرفة أكتر خطوة معطلة الشغل',keywords:['تشغيل','تاخير','تأخير','تسليم','جودة','اخطاء','أخطاء','مخزون','عملية','انتاج','إنتاج'],confirm:'أنهي خطوة بتعطّل التسليم أو بتخليك تعيد الشغل بسبب خطأ أو نقص؟',noGo:'ما تعيّنش ناس جديدة ولا تشتري أدوات قبل ما تعرف أنهي خطوة بتعطل الطلبات أو بتخليك تعيد الشغل.',cta:'شوف إزاي تحل أكتر خطوة معطلة للشغل داخل البرنامج',riskBias:3},
    expansion:{label:'التأكد إن الشغل جاهز يكبر',keywords:['توسع','اتوسع','أوسع','تكبير','سوق جديد','منطقة جديدة','نمو سريع'],confirm:'هل فيه ناس عايزة تشتري في المكان الجديد؟ وهل فريقك وأرقامك يسمحوا بتجربة صغيرة من غير مخاطرة كبيرة؟',noGo:'ما تدخلش في مصاريف ثابتة كبيرة قبل ما تجرب الطلب وقدرة فريقك على شغل زيادة في نطاق صغير.',cta:'شوف إزاي تختبر التوسع قبل ما تدفع مصاريف كبيرة',riskBias:10},
    new_branch:{label:'التأكد إن فتح فرع جديد خطوة مناسبة',keywords:['فرع جديد','فتح فرع','افتح فرع','أفتح فرع','فرع تاني','فرع ثاني'],confirm:'هل فيه طلب حقيقي في المنطقة؟ وهل الفرع يقدر يغطي مصاريفه وفريقك يقدر يشغله بنفس الجودة؟',noGo:'ما توقّعش عقد ولا تجهز فرع كامل قبل ما تجرب البيع والتسليم في المنطقة بطريقة مؤقتة وأقل تكلفة.',cta:'شوف إزاي تختبر فكرة الفرع قبل ما تلتزم',riskBias:14},
    new_product:{label:'التأكد إن المنتج أو الخدمة الجديدة مطلوبة',keywords:['منتج جديد','خدمة جديدة','اطلق منتج','أطلق منتج','اضيف خدمة','أضيف خدمة'],confirm:'هل المنتج أو الخدمة الجديدة بتحل مشكلة مهمة لدرجة إن العميل يجرب أو يحجز أو يدفع؟',noGo:'ما تعملش المنتج كامل قبل ما تعرض نسخة صغيرة وتشوف هل فيه حد مستعد يجرب أو يحجز أو يدفع.',cta:'شوف إزاي تختبر المنتج أو الخدمة الجديدة',riskBias:6},
    customer_concentration:{label:'معرفة خطر الاعتماد على عميل أو اتنين',keywords:['عميل واحد','عميل كبير','معظم المبيعات','اعتماد على عميل','تركيز العملاء','خسارة عميل'],confirm:'هل جزء كبير من دخل المشروع جاي من عميل أو اتنين، ولو واحد مشي هتتأثر بقوة؟',noGo:'ما تستخدمش خصومات لكل الناس علشان تعوض الاعتماد على عميل كبير؛ جرّب نوع عملاء أو مكان بيع جديد الأول.',cta:'شوف إزاي تقلل اعتمادك على عميل أو اتنين',riskBias:8},
    general_decision:{label:'تحديد قرار المشروع اللي محتاج تحسمه',keywords:[],confirm:'إيه القرار المحدد اللي محتاج تعرف عنه حاجة مؤكدة قبل ما تتحرك؟',noGo:'ما تصرفش فلوس أو وقت كبير قبل ما تحدد القرار نفسه وإيه المعلومة اللي لو عرفتها هتغيّره.',cta:'شوف إزاي تحوّل الحيرة لقرار واضح',riskBias:4}
  };

  const CORE={
    idea:[
      {id:'idea_customer',axis:'customer',evidenceWeight:.5,prompt:'مين العميل الأقرب للفكرة؟ وقد إيه متأكد إن المشكلة دي مهمة له دلوقتي؟',options:[
        {value:0,label:'لسه مش محدد العميل أو المشكلة'},
        {value:1,label:'محددهم بشكل عام من افتراضاتي'},
        {value:2,label:'اتكلمت مع ناس مناسبين وسمعت المشكلة منهم'},
        {value:3,label:'نفس المشكلة اتكررت بوضوح مع أكتر من عميل مناسب'}
      ]},
      {id:'idea_demand',axis:'demand',evidenceWeight:.8,prompt:'إيه أقوى دليل عندك إن العميل مستعد يعمل خطوة فعلية ناحية الحل؟',options:[
        {value:0,label:'مفيش خطوة فعلية لحد دلوقتي'},
        {value:1,label:'فيه إعجاب أو اهتمام بالكلام'},
        {value:2,label:'فيه تجربة أو طلب تفاصيل جاد'},
        {value:3,label:'فيه حجز أو طلب أو دفع فعلي'}
      ]},
      {id:'idea_economics',axis:'economics',evidenceWeight:.5,prompt:'قد إيه أرقام أول بيعة واضحة عندك: سعر البيع، التكلفة المباشرة، واللي هيفضل منها؟',options:[
        {value:0,label:'لسه ما حسبتش الأرقام'},
        {value:1,label:'عندي تقدير عام'},
        {value:2,label:'حسبت نموذج أو سيناريو مبدئي'},
        {value:3,label:'عندي حساب واضح ومراجع للأرقام الأساسية'}
      ]},
      {id:'idea_execution',axis:'execution',evidenceWeight:.4,prompt:'هل تقدر تختبر الفكرة بنسخة صغيرة خلال 7 أيام من غير ما تبني المشروع كامل؟',options:[
        {value:0,label:'مش عارف أبدأ بإيه'},
        {value:1,label:'عندي تصور لكن محتاج تجهيز كبير'},
        {value:2,label:'محدد نسخة بسيطة أقدر أجربها'},
        {value:3,label:'محدد النسخة والعميل وطريقة التسليم فعلًا'}
      ]},
      {id:'idea_decision',axis:'decision',evidenceWeight:.4,prompt:'قبل ما تبدأ التجربة، هل محدد إمتى تعتبرها ناجحة وإمتى تعدّل أو توقف؟',options:[
        {value:0,label:'لا، هجرّب وأشوف'},
        {value:1,label:'عندي فكرة عامة عن النجاح'},
        {value:2,label:'محدد معيار أو اتنين بشكل مبدئي'},
        {value:3,label:'محدد معيار نجاح وحد توقف وموعد مراجعة'}
      ]},
      {id:'idea_evidence',metric:'evidence',evidenceWeight:2,prompt:'لما تقول إن الفكرة واعدة، أقوى حاجة بتعتمد عليها إيه؟',options:[
        {value:0,label:'إحساسي أو رأي ناس قريبة'},
        {value:1,label:'مقابلات أو ملاحظات قليلة'},
        {value:2,label:'تجربة صغيرة أو طلبات أولية'},
        {value:3,label:'شراء/حجز أو سلوك متكرر من عملاء مناسبين'}
      ]}
    ],
    running:[
      {id:'run_customer',axis:'customer',evidenceWeight:.5,prompt:'قد إيه عارف أنهي نوع عميل بيديك أفضل مزيج من تكرار الشراء والرضا والمكسب؟',options:[
        {value:0,label:'مش عارف أو بتعامل كل العملاء بنفس الشكل'},
        {value:1,label:'عندي انطباع من الخبرة'},
        {value:2,label:'عندي ملاحظات أو أرقام لفترة محدودة'},
        {value:3,label:'مقسم العملاء وبراجع الشراء والربحية بانتظام'}
      ]},
      {id:'run_demand',axis:'demand',evidenceWeight:.6,prompt:'هل تقدر تميّز الطلب الحقيقي المتكرر عن مبيعات جاية من خصم أو ظرف مؤقت؟',options:[
        {value:0,label:'لا، كل المبيعات عندي رقم واحد'},
        {value:1,label:'أحيانًا بلاحظ الفرق'},
        {value:2,label:'بفصل بينهم في بعض الفترات أو القنوات'},
        {value:3,label:'بتابع التكرار ومصدر الطلب بشكل واضح ومنتظم'}
      ]},
      {id:'run_economics',axis:'economics',evidenceWeight:.7,prompt:'بالنسبة للقرار اللي بتراجعه، هل السعر والتكلفة والتحصيل من نفس الفترة ومتسجلين بطريقة واحدة؟',options:[
        {value:0,label:'الأرقام مش متجمعة أو مش متوافقة'},
        {value:1,label:'عندي أرقام متفرقة أو من فترات مختلفة'},
        {value:2,label:'جمعت فترة واحدة بشكل مبدئي'},
        {value:3,label:'عندي أرقام متسقة وبراجعها دوريًا'}
      ]},
      {id:'run_execution',axis:'execution',evidenceWeight:.5,prompt:'قد إيه عندك رؤية واضحة لرحلة الطلب من دخوله لحد التسليم والتحصيل؟',options:[
        {value:0,label:'مش متابع الرحلة كاملة'},
        {value:1,label:'بعرف المشاكل لما تحصل'},
        {value:2,label:'متابع أغلب الخطوات ووقت التنفيذ'},
        {value:3,label:'متابع الخطوات والوقت والأخطاء والتحصيل بانتظام'}
      ]},
      {id:'run_decision',axis:'decision',evidenceWeight:.5,prompt:'هل القرار مربوط برقم أو شرط واضح وموعد مراجعة محدد؟',options:[
        {value:0,label:'لا، القرار مبني على الإحساس غالبًا'},
        {value:1,label:'عندي هدف عام فقط'},
        {value:2,label:'محدد رقم أو شرط مبدئي'},
        {value:3,label:'محدد معيار قرار وحد توقف وموعد مراجعة'}
      ]},
      {id:'run_evidence',metric:'evidence',evidenceWeight:2,prompt:'أقوى دليل بتعتمد عليه في القرار الحالي جاي منين؟',options:[
        {value:0,label:'إحساس أو انطباع شخصي'},
        {value:1,label:'ملاحظات أو حالات فردية'},
        {value:2,label:'أرقام أو تجربة لفترة محدودة'},
        {value:3,label:'بيانات متكررة ومراجعة من أكتر من مصدر داخل المشروع'}
      ]}
    ]
  };

  const TYPE_QUESTIONS={
    idea_validation:[
      {id:'iv_problem',axis:'customer',evidenceWeight:1,prompt:'كام شخص مناسب قال من نفسه إنه بيعاني من نفس المشكلة، من غير ما تشرح له فكرتك؟',options:[{value:0,label:'محدش قالها من نفسه'},{value:1,label:'شخص واحد قال حاجة قريبة'},{value:2,label:'اتنين أو تلاتة وصفوا نفس المشكلة'},{value:3,label:'أكتر من تلاتة كرروا نفس المشكلة بوضوح'}]},
      {id:'iv_commitment',axis:'demand',evidenceWeight:1.5,prompt:'أقوى خطوة عملها حد مهتم كانت إيه؟',options:[{value:0,label:'قال إن الفكرة حلوة بس'},{value:1,label:'وافق يدي وقت أو يتكلم أكتر'},{value:2,label:'وافق يجرب أو طلب تفاصيل جدية'},{value:3,label:'حجز أو طلب أو دفع فعلًا'}]}
    ],
    pricing:[
      {id:'price_margin',axis:'economics',evidenceWeight:1.2,prompt:'بعد الخصومات والمرتجعات وتكلفة تنفيذ الطلب، عارف بيفضل لك كام من كل بيعة؟',options:[{value:0,label:'مش عارف'},{value:1,label:'عندي تقدير تقريبي'},{value:2,label:'حسبتها لبعض المنتجات أو الخدمات'},{value:3,label:'بحسبها بانتظام وعندي رقم واضح'}]},
      {id:'price_test',axis:'demand',evidenceWeight:1.3,prompt:'جرّبت سعرًا مختلفًا مع عدد قليل من نفس نوع العملاء وشفت مين اشترى فعلًا؟',options:[{value:0,label:'ما جربتش'},{value:1,label:'سألت الناس عن رأيها بس'},{value:2,label:'جربت السعر على عدد قليل'},{value:3,label:'جربته وسجلت القبول والشراء الفعلي'}]}
    ],
    cashflow:[
      {id:'cash_cycle',axis:'economics',evidenceWeight:1.4,prompt:'في المتوسط، بياخد كام يوم من وقت ما تبيع لحد ما الفلوس تدخل عندك فعلًا؟',options:[{value:0,label:'مش عارف'},{value:1,label:'بعرف المدة في بعض البيعات'},{value:2,label:'حسبتها لفترة قصيرة'},{value:3,label:'متابع متوسط الأيام بانتظام'}]},
      {id:'cash_split',axis:'execution',evidenceWeight:1.1,prompt:'لما تسجل شغلك، بتفرّق بين يوم البيع، ويوم إصدار الفاتورة، ويوم دخول الفلوس، ويوم دفع المصروف؟',options:[{value:0,label:'لا، كله متسجل كرقم واحد'},{value:1,label:'بفرّق بينهم أحيانًا'},{value:2,label:'متفصلين في أغلب البيعات'},{value:3,label:'كل تاريخ متسجل بوضوح وبانتظام'}]}
    ],
    sales:[
      {id:'sales_funnel',axis:'execution',evidenceWeight:1.2,prompt:'عارف أغلب الناس بتقف فين: بعد ما تسأل، ولا بعد ما تعرف السعر، ولا قبل الشراء؟'},
      {id:'sales_offer',axis:'customer',evidenceWeight:1,prompt:'اللي بتعرضه بيقول للعميل بوضوح هتحل له إيه والنتيجة اللي هياخدها؟'}
    ],
    marketing:[
      {id:'marketing_quality',axis:'demand',evidenceWeight:1.2,prompt:'بتتابع كام شخص جاي من الإعلان كان مناسب فعلًا واشترى، مش بس كام واحد بعت رسالة؟'},
      {id:'marketing_unit',axis:'economics',evidenceWeight:1.3,prompt:'عارف بتدفع كام في الإعلان علشان تكسب عميل جديد، وبيفضل لك كام من بيعته بعد تكلفة تنفيذها؟'}
    ],
    cost_reduction:[
      {id:'cost_value',axis:'economics',evidenceWeight:1.2,prompt:'عارف كل مصروف بيأثر إزاي على البيع أو الجودة أو التسليم أو دخول الفلوس؟'},
      {id:'cost_test',axis:'execution',evidenceWeight:1,prompt:'تقدر تقلل مصروف واحد لفترة قصيرة وتشوف هل الجودة أو التسليم اتأثروا؟'}
    ],
    operations:[
      {id:'ops_wait',axis:'execution',evidenceWeight:1.4,prompt:'متابع الوقت اللي الطلب بيقف فيه، وعدد المرات اللي بتعيد فيها الشغل بسبب خطأ أو نقص؟'},
      {id:'ops_customer',axis:'customer',evidenceWeight:1,prompt:'عارف أنهي تأخير بيضايق العميل فعلًا وأنهي تأخير مجرد مشكلة داخلية عندك؟'}
    ],
    expansion:[
      {id:'expand_repeat',axis:'execution',evidenceWeight:1.2,prompt:'لو الشغل زاد فجأة، فريقك ونظامك يقدروا يستحملوا من غير ما الجودة أو التسليم يقعوا؟',options:[{value:0,label:'لا، الشغل واقف عليّ أو بيتعطل'},{value:1,label:'نقدر بصعوبة ولمدة قصيرة'},{value:2,label:'جربنا زيادة بسيطة والشغل استمر'},{value:3,label:'عندنا طريقة واضحة تستحمل شغل زيادة'}]},
      {id:'expand_demand',axis:'demand',evidenceWeight:1.4,prompt:'فيه ناس من السوق أو المنطقة الجديدة طلبت تشتري أو سألت بشكل جاد فعلًا؟'}
    ],
    new_branch:[
      {id:'branch_demand',axis:'demand',evidenceWeight:1.5,prompt:'فيه ناس من المنطقة الجديدة طلبت تشتري أو سألت بشكل جاد فعلًا؟',options:[{value:0,label:'لا، ده توقع مني'},{value:1,label:'فيه أسئلة عابرة من ناس قليلة'},{value:2,label:'فيه طلبات أو محادثات جدية'},{value:3,label:'فيه طلبات أو مبيعات متكررة من المنطقة'}]},
      {id:'branch_economics',axis:'economics',evidenceWeight:1.3,prompt:'عارف الفرع لازم يبيع تقريبًا بكام كل شهر علشان يغطي مصاريفه؟ ولو المبيعات طلعت أقل من المتوقع، تقدر تستحمل قد إيه؟',options:[{value:0,label:'مش عارف'},{value:1,label:'عندي تقدير عام للمصاريف'},{value:2,label:'حسبت المبيعات المطلوبة بشكل مبدئي'},{value:3,label:'عندي حساب واضح وعارف أقدر أستحمل لحد إمتى'}]}
    ],
    new_product:[
      {id:'product_problem',axis:'customer',evidenceWeight:1.2,prompt:'المشكلة اللي المنتج الجديد بيحلها مهمة للعميل لدرجة إنه عايز يحلها دلوقتي؟'},
      {id:'product_preorder',axis:'demand',evidenceWeight:1.5,prompt:'قبل ما تعمل المنتج كامل، هل حد طلب يجربه أو حجزه أو دفع جزء من ثمنه؟'}
    ],
    customer_concentration:[
      {id:'concentration_share',axis:'economics',evidenceWeight:1.3,prompt:'عارف أكبر 3 عملاء بيدخلوا كام من دخل المشروع، وبيفضل لك منهم كام، وبيدفعوا بعد قد إيه؟'},
      {id:'concentration_alt',axis:'demand',evidenceWeight:1.1,prompt:'جربت تبيع لنوع عملاء مختلف أو من مكان جديد علشان ما تعتمدش على عميل أو اتنين؟'}
    ],
    general_decision:[
      {id:'general_options',axis:'decision',evidenceWeight:1,prompt:'كتبت الاختيارات المتاحة فعلًا، ولا مركز على اختيار واحد وبتحاول تقنع نفسك به؟'},
      {id:'general_change',axis:'decision',evidenceWeight:1.2,prompt:'عارف إيه المعلومة الجديدة اللي لو ظهرت هتخليك تغيّر قرارك؟'}
    ]
  };

  const STAGE_FOLLOW={
    idea:{id:'stage_idea_commitment',axis:'demand',evidenceWeight:1,prompt:'قبل ما تعتبر الاهتمام دليل طلب، إيه أقوى التزام أخدته من عميل مناسب؟',options:[
      {value:0,label:'مفيش التزام؛ مجرد رأي أو إعجاب'},
      {value:1,label:'وافق يتكلم أو يشوف تفاصيل'},
      {value:2,label:'وافق يجرب أو يحجز مبدئيًا'},
      {value:3,label:'طلب أو حجز أو دفع فعلًا'}
    ]},
    running:{id:'stage_run_90days',axis:'economics',evidenceWeight:1,prompt:'لو طلبت دلوقتي أرقام آخر 90 يوم الخاصة بالقرار، هتطلعها قد إيه بسهولة وبنفس التعريفات؟',options:[
      {value:0,label:'مش متاحة أو كل مصدر بيدي رقم مختلف'},
      {value:1,label:'هجمعها يدويًا وهتحتاج تنضيف كبير'},
      {value:2,label:'معظمها متاح لكن محتاج مراجعة بسيطة'},
      {value:3,label:'متاحة ومتسقة وأقدر أراجعها فورًا'}
    ]}
  };

  const WEAK_FOLLOW={
    customer:{id:'weak_customer',axis:'customer',evidenceWeight:1,prompt:'لما توصف مشكلة العميل، قد إيه الكلام ده جاي من العميل نفسه؟',options:[
      {value:0,label:'من افتراضاتي أنا'},
      {value:1,label:'من كلام حالة أو حالتين'},
      {value:2,label:'اتكرر مع عدة عملاء مناسبين'},
      {value:3,label:'اتكرر ومعاه تصرف أو شراء يؤكد أهميته'}
    ]},
    demand:{id:'weak_demand',axis:'demand',evidenceWeight:1.2,prompt:'قد إيه عندك سلوك حقيقي تقدر تعدّه بدل كلام الاهتمام؟',options:[
      {value:0,label:'مفيش سلوك قابل للعد'},
      {value:1,label:'استفسارات أو اهتمام فقط'},
      {value:2,label:'تجارب/طلبات أولية قابلة للعد'},
      {value:3,label:'شراء/حجز متكرر أو التزام واضح'}
    ]},
    economics:{id:'weak_economics',axis:'economics',evidenceWeight:1.2,prompt:'قد إيه الأرقام اللي بتعتمد عليها موثقة: مصدرها، فترتها، وتعريفها؟',options:[
      {value:0,label:'الأرقام تقديرية أو غير موثقة'},
      {value:1,label:'بعضها معروف المصدر وبعضها لا'},
      {value:2,label:'معظمها موثق لنفس الفترة'},
      {value:3,label:'كل رقم له مصدر وفترة وتعريف واضح'}
    ]},
    execution:{id:'weak_execution',axis:'execution',evidenceWeight:1,prompt:'هل قست خطوة واحدة على الأقل في التشغيل من حيث الوقت والجودة والتكلفة؟',options:[
      {value:0,label:'لا، ما قستش'},
      {value:1,label:'عندي تقدير من الخبرة'},
      {value:2,label:'قستها لفترة أو على عينة'},
      {value:3,label:'بقيسها بانتظام وبعرف الانحرافات'}
    ]},
    decision:{id:'weak_decision',axis:'decision',evidenceWeight:1,prompt:'قد إيه القرار له نقطة بداية وحد توقف وموعد مراجعة واضحين؟',options:[
      {value:0,label:'مش محددين'},
      {value:1,label:'واحد منهم واضح فقط'},
      {value:2,label:'معظمهم محدد بشكل مبدئي'},
      {value:3,label:'البداية وحد التوقف وموعد المراجعة محددين'}
    ]}
  };

  const GAP_INFO={
    customer:{why:'لو مش محدد مين العميل وإيه مشكلته، ممكن تقدم حاجة كويسة لشخص مش محتاجها.',missing:'كلام أو تصرف مباشر من عميل مناسب يوضح إن المشكلة مهمة له دلوقتي.'},
    demand:{why:'الإعجاب مش معناه إن الشخص هيشتري؛ القرار محتاج خطوة حقيقية تقدر تعدّها.',missing:'طلب أو تجربة أو حجز أو شراء فعلي، مش مجرد كلام مشجع.'},
    economics:{why:'لو الأرقام من أوقات مختلفة أو متسجلة بطرق مختلفة، مش هتعرف تأثير السعر والمصاريف وتأخر الدفع.',missing:'أرقام من نفس الفترة توضح دخل كل بيعة، وتكلفتها، والفلوس اللي دخلت فعلًا.'},
    execution:{why:'حتى القرار الجيد ممكن يتعطل لو خطوات الشغل مش واضحة أو الأخطاء بتتكرر.',missing:'قياس لوقت تنفيذ الطلب، وفترات الانتظار، والأخطاء اللي بتخليك تعيد الشغل.'},
    decision:{why:'لو مش محدد إمتى تكمل وإمتى توقف وتراجع، التجربة ممكن تستمر وتستهلك فلوس ووقت بلا نهاية.',missing:'قرار واضح، ورقم أساسي تقرر عليه، ووقت محدد للتوقف والمراجعة.'}
  };

  const PLANS={
    idea_validation:['اكتب في جملة واحدة: مين ممكن يشتري، وإيه المشكلة اللي عنده.','اتكلم مع 3 أشخاص مناسبين واسألهم بيحلوا المشكلة دي إزاي دلوقتي.','جهّز أبسط حاجة تقدر تعرضها كتجربة، من غير ما تعمل المشروع كامل.','اعرض التجربة على 5 أشخاص، وسجل مين طلب يجرب أو يحجز أو يدفع.','راجع أسباب الرفض، وغيّر توقعًا واحدًا بس في المرة الجاية.','اكتب إيه اللي لو حصل هتعتبر التجربة ماشية كويس، وإمتى هتوقف.','قرر: تجربة صغيرة تانية، ولا توقف مؤقتًا.'],
    pricing:['اكتب السعر اللي العميل بيدفعه فعلًا بعد أي خصم أو مرتجع.','اكتب تكلفة تنفيذ كل بيعة، وشوف بيفضل لك كام منها.','قسّم العملاء حسب سبب الشراء وطريقة استخدامهم للي بتبيعه.','اختار نوع واحد من العملاء وجرّب معاه سعرًا مختلفًا.','اعرض السعر وسجل مين وافق ومين رفض ومين اشترى.','قارن اللي بيفضل لك من البيعة وعدد اللي اشتروا، مش عدد الطلبات بس.','راجع النتيجة وقرر: تثبت السعر، تعدله، ولا تجرب على عدد أكبر.'],
    cashflow:['اجمع بيانات آخر 20 بيعة.','اكتب لكل بيعة: يوم البيع ويوم دخول الفلوس فعلًا.','احسب في المتوسط الفلوس بتدخل بعد كام يوم.','حدد أنهي عملاء أو منتجات فلوسهم بتتأخر أكتر.','جرّب تغيير ميعاد أو طريقة الدفع في عدد قليل من البيعات.','شوف هل الفلوس دخلت أسرع من غير ما العملاء يرفضوا.','راجع النتيجة وقرر هل تعمم التغيير ولا تعدله.'],
    sales:['اكتب الخطوات اللي بيمر بها الشخص من أول ما يسأل لحد ما يشتري.','اكتب عدد الأشخاص الموجودين في كل خطوة.','حدد أنهي خطوة عندها أكبر عدد من الناس بيقف ومابيكمّلش.','راجع 5 محادثات أو عروض بيع حقيقية.','غيّر حاجة واحدة بس في العرض أو المتابعة.','جرّب التغيير وشوف كام شخص كمل للخطوة اللي بعدها.','قرر تحتفظ بالتغيير ولا توقفه.'],
    marketing:['اكتب كل عميل عرفك منين، وهل اشترى فعلًا ولا لأ.','احسب صرفت كام في كل مكان علشان تكسب عميلًا واحدًا.','فرّق بين أي شخص بعت رسالة والشخص المناسب فعلًا للي بتبيعه.','اختار رسالة واحدة وجربها على عدد صغير.','اصرف مبلغًا صغيرًا تحدده قبل ما تبدأ.','قِس كام شخص مناسب اشترى وبيفضل لك كام من بيعته، مش عدد الضغطات بس.','قرر أنهي مكان يستحق ميزانيتك الجاية.'],
    cost_reduction:['اكتب أكبر 10 مصاريف في المشروع.','اكتب قدام كل مصروف: هل بيحمي البيع أو الجودة أو التسليم؟','اختار مصروفًا تأثيره قليل على العميل.','قلله لفترة قصيرة بطريقة تقدر ترجع عنها.','جرّب التغيير في جزء صغير من الشغل.','راقب الجودة والوقت واللي بيفضل لك من كل بيعة.','قرر تثبت التغيير ولا ترجع عنه.'],
    operations:['اكتب خطوات طلب واحد من أول ما يدخل لحد ما يتسلّم والفلوس تدخل.','سجل كل خطوة بتاخد وقت قد إيه، وبتقف مستنية قد إيه.','حدد أكتر خطوة معطلة الشغل أو بتخليك تعيد شغل بسبب خطأ.','غيّر خطوة واحدة بس.','جرّب التغيير على عدد قليل من الطلبات.','قارن الوقت والجودة والتكلفة قبل وبعد.','لو النتيجة أحسن ثبّت التغيير، ولو لأ ارجع وعدله.'],
    expansion:['اكتب مين متوقع يشتري في المكان الجديد وإيه اللي يثبت توقعك.','شوف فريقك يقدر ينفذ كام طلب زيادة بنفس الجودة والميعاد، حتى لو أنت مش موجود.','اكتب المصاريف اللي هتدفعها مرة واحدة، والمصاريف اللي هتزيد مع كل بيعة.','جرّب البيع في مكان واحد أو بطريقة واحدة لفترة قصيرة.','حدد أقصى مبلغ هتصرفه قبل ما تبدأ.','سجل الطلبات المدفوعة، واللي بيفضل من كل بيعة، وهل التسليم تم كويس.','قرر تكبّر التجربة، تعدلها، ولا توقفها.'],
    new_branch:['اسأل العملاء: إيه اللي هيخلي وجود فرع قريب مهم بالنسبة لهم؟','اجمع طلبات أو أسئلة جدية من ناس في المنطقة الجديدة.','احسب الفرع محتاج يبيع بكام علشان يغطي مصاريفه، وقد إيه تقدر تستحمل لو البيع كان أقل.','جرّب البيع يومًا مؤقتًا، أو التوصيل للمنطقة، أو نقطة استلام بسيطة.','شغّل التجربة من غير عقد طويل أو تجهيز كامل.','سجل عدد الطلبات المدفوعة، واللي بيفضل من كل بيعة، وجودة التسليم.','قرر: تفتح فرع، تطوّل التجربة، ولا توقف.'],
    new_product:['اكتب المشكلة اللي المنتج الجديد هيحلها بكلام العميل نفسه.','اتكلم مع 3 عملاء من نفس النوع اللي بتبيع له دلوقتي.','اعمل صورة أو عينة بسيطة توضح اللي هتقدمه، من غير ما تنفذه كامل.','اطلب من المهتم يجرب أو يحجز أو يدفع جزءًا.','سلّم نسخة صغيرة لعميل واحد.','راقب هل استخدمها فعلًا وهل طلبها مرة تانية.','قرر تكمل، تعدل، ولا توقف.'],
    customer_concentration:['احسب أكبر 3 عملاء بيدخلوا كام من إجمالي دخل المشروع.','اكتب لكل واحد: بيفضل لك كام من بيعاته، وبيدفع بعد كام يوم.','احسب إيه اللي هيحصل لو أكبر عميل وقف شراء.','اختار نوع عملاء قريب تقدر تبيع له بدل الاعتماد على نفس العملاء.','اعرض حاجة محددة على 5 عملاء جدد.','سجل مين اهتم بجد، ومين طلب، وقد إيه ممكن يفضل لك من البيعة.','حدد رقمًا واضحًا لنسبة الدخل اللي عايزها من عملاء جدد.'],
    general_decision:['اكتب القرار وكل الاختيارات المتاحة قدامك.','قسّم اللي تعرفه لحاجات حصلت فعلًا وحاجات أنت متوقعها.','حدد معلومة واحدة لو عرفتها ممكن تغيّر قرارك.','اعمل تجربة صغيرة علشان تعرف المعلومة دي.','حدد أقصى مبلغ ووقت قبل ما تبدأ.','اكتب النتيجة زي ما حصلت، حتى لو مش هي اللي كنت متوقعها.','ارجع للقرار في اليوم اللي حددته واختر الخطوة التالية.']
  };
  const EXPERIMENTS={
    idea_validation:{hypothesis:'ناس محددة عندها المشكلة دلوقتي ومستعدة تعمل خطوة علشان تحلها.',test:'اعرض تجربة صغيرة على 5 أشخاص مناسبين.',duration:'7 أيام',cost:'وقت المقابلات فقط، من غير تجهيز المشروع كامل.',success:'شخصان على الأقل يطلبوا يجربوا أو يحجزوا أو يدفعوا.',stop:'بعد 5 محاولات مناسبة، محدش عمل خطوة حقيقية.',review:'نهاية اليوم السابع'},
    pricing:{hypothesis:'نوع محدد من العملاء هيقبل سعرًا أعلى لو فهم بوضوح هو هياخد إيه.',test:'اعرض السعر الجديد على 5 أشخاص متشابهين.',duration:'7 أيام',cost:'ما تغيّرش السعر لكل العملاء أثناء التجربة.',success:'نفس نسبة الشراء تقريبًا، مع مبلغ أكبر بيفضل لك من كل بيعة.',stop:'عدد اللي بيشتروا قل بوضوح، والزيادة في السعر ما عوضتش الفرق.',review:'بعد 5 عروض أو 7 أيام'},
    cashflow:{hypothesis:'تغيير ميعاد أو طريقة الدفع هيخلي الفلوس تدخل أسرع من غير ما يقل الشراء.',test:'جرّب طريقة الدفع الجديدة في 5 بيعات مناسبة.',duration:'7 أيام',cost:'من غير أي مصروف جديد يصعب ترجع فيه.',success:'الفلوس تدخل في وقت أقصر، ونفس عدد العملاء تقريبًا يوافق.',stop:'العملاء يرفضوا بشكل متكرر أو الدفع يتأخر أكتر.',review:'نهاية اليوم السابع'},
    sales:{hypothesis:'تغيير خطوة واحدة هيخلي ناس أكتر تكمل للخطوة اللي بعدها.',test:'جرّب نفس التغيير مع 10 أشخاص مهتمين.',duration:'7 أيام',cost:'وقت المتابعة فقط.',success:'عدد أكبر من الناس يكمل مقارنة بما كان بيحصل قبل التغيير.',stop:'مفيش تحسن بعد 10 أشخاص متشابهين.',review:'بعد الشخص العاشر'},
    marketing:{hypothesis:'رسالة محددة هتجيب ناس أنسب للشراء، مش مجرد ضغطات أو رسائل أكتر.',test:'اعمل إعلانًا صغيرًا برسالة واحدة ولنفس نوع الناس.',duration:'7 أيام',cost:'اكتب أقصى مبلغ هتصرفه قبل ما تبدأ.',success:'ناس مناسبة أكتر تكمل للشراء أو تعمل خطوة جدية.',stop:'تصرف المبلغ المحدد من غير ما ييجي ناس مناسبة.',review:'لما المبلغ يخلص أو في اليوم السابع'},
    cost_reduction:{hypothesis:'تقدر تقلل مصروفًا واحدًا من غير ما الجودة أو التسليم يتأثروا.',test:'قلل المصروف لفترة قصيرة وفي جزء صغير من الشغل.',duration:'7 أيام',cost:'اختار تغييرًا تقدر ترجع عنه فورًا.',success:'المصروف يقل والجودة وميعاد التسليم يفضلوا زي ما هم.',stop:'أي تراجع واضح في الجودة أو الطلب أو التسليم.',review:'نهاية اليوم السابع'},
    operations:{hypothesis:'حل أكتر خطوة معطلة هيقلل وقت تنفيذ الطلب.',test:'غيّر خطوة واحدة وجرّبها على 10 طلبات.',duration:'7 أيام',cost:'من غير شراء برنامج أو نظام جديد.',success:'الطلبات تخلص أسرع من غير زيادة الأخطاء.',stop:'الأخطاء تزيد، أو تضطر تعيد الشغل، أو التسليم يتأخر.',review:'بعد 10 طلبات'},
    expansion:{hypothesis:'فيه ناس مستعدة تشتري في المكان الجديد، وفريقك يقدر يخدمها من غير مصاريف كبيرة ثابتة.',test:'جرّب البيع في منطقة واحدة أو بطريقة بيع واحدة.',duration:'7 أيام',cost:'حدد مبلغًا صغيرًا كحد أقصى قبل البداية.',success:'طلبات مدفوعة تتسلّم بجودة وميعاد مقبولين.',stop:'مفيش شراء فعلي أو الشغل الحالي اتعطل.',review:'نهاية التجربة'},
    new_branch:{hypothesis:'المنطقة الجديدة فيها شراء فعلي يكفي لتغطية مصاريف الفرع.',test:'جرّب يوم بيع مؤقت، أو التوصيل، أو نقطة استلام بسيطة.',duration:'7 أيام',cost:'من غير عقد طويل أو تجهيز فرع كامل.',success:'طلبات مدفوعة، وبيفضل مبلغ مناسب من كل بيعة، وتقدر تكرر التسليم بنفس الجودة.',stop:'الطلبات قليلة أو تكلفة توصيل وخدمة الطلبات أعلى من المقبول.',review:'بعد أسبوع التجربة'},
    new_product:{hypothesis:'العملاء الحاليون مستعدين يجربوا المنتج الجديد أو يحجزوه.',test:'اعرض عينة بسيطة أو حجزًا مسبقًا على 5 عملاء.',duration:'7 أيام',cost:'تكلفة عمل عينة واحدة بسيطة.',success:'شخصان يحجزوا أو يجربوا فعلًا.',stop:'بعد 5 عروض مناسبة، محدش عمل خطوة حقيقية.',review:'اليوم السابع'},
    customer_concentration:{hypothesis:'نوع قريب من العملاء الحاليين ممكن يشتري منك بسعر يترك لك مكسبًا مناسبًا.',test:'اعرض حاجة محددة على 5 عملاء جدد.',duration:'7 أيام',cost:'وقت تواصل محدود، من غير مصروف كبير.',success:'شخصان يعملوا خطوة جدية أو شخص واحد يطلب فعلًا.',stop:'بعد 5 محاولات مع ناس مناسبة، مفيش استجابة.',review:'بعد المحاولة الخامسة'},
    general_decision:{hypothesis:'معلومة واحدة محددة ممكن تغيّر القرار.',test:'اعمل أصغر تجربة تقدر تجيب لك المعلومة دي.',duration:'7 أيام',cost:'اكتب أقصى مبلغ هتصرفه قبل ما تبدأ.',success:'النتيجة توضّح إن اختيارًا أنسب من الباقي.',stop:'التجربة خلصت ولسه مش بتفرق بين الاختيارات.',review:'نهاية اليوم السابع'}
  };

  function normalize(value){return String(value||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').trim();}
  function classifyProblem(text,quickChoice,stage){
    const normalized=normalize(text);
    if(quickChoice&&quickChoice!=='قرار آخر'&&QUICK_MAP[quickChoice]) return QUICK_MAP[quickChoice];
    if(!normalized&&quickChoice&&QUICK_MAP[quickChoice]) return QUICK_MAP[quickChoice];
    let best='general_decision',bestScore=0;
    Object.keys(DECISIONS).forEach(type=>{
      let score=0;
      DECISIONS[type].keywords.forEach(keyword=>{if(normalized.includes(normalize(keyword)))score+=normalize(keyword).includes(' ')?3:1;});
      if(type==='idea_validation'&&stage==='idea')score+=1;
      if(type==='new_branch'&&/فرع/.test(normalized))score+=3;
      if(score>bestScore){best=type;bestScore=score;}
    });
    if(bestScore===0&&quickChoice&&QUICK_MAP[quickChoice])return QUICK_MAP[quickChoice];
    return best;
  }
  function decorate(question){return Object.assign({options:SCALE,evidenceWeight:.25},question);}
  function coreQuestions(stage){return (CORE[stage]||CORE.running).map(decorate);}
  function weakAxisFromCore(stage,answers){
    const totals={customer:0,demand:0,economics:0,execution:0,decision:0};
    coreQuestions(stage).forEach(q=>{if(q.axis)totals[q.axis]=Number(answers[q.id]??0);});
    return Object.keys(totals).sort((a,b)=>totals[a]-totals[b])[0];
  }
  function adaptiveQuestions(stage,type,answers){
    const weak=weakAxisFromCore(stage,answers);
    return [...(TYPE_QUESTIONS[type]||TYPE_QUESTIONS.general_decision),STAGE_FOLLOW[stage]||STAGE_FOLLOW.running,WEAK_FOLLOW[weak]].map(decorate);
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
  function band(value,cuts,labels){return value<cuts[0]?labels[0]:value<cuts[1]?labels[1]:labels[2];}
  function personalizedPlan(type,gaps,stage){
    const experiment=EXPERIMENTS[type]||EXPERIMENTS.general_decision;
    const label=DECISIONS[type]?.label||DECISIONS.general_decision.label;
    return [
      'اكتب القرار بصيغة واحدة محددة: «'+label+'»، وحدد إيه اللي هيتغير لو القرار كان صح.',
      'اقفل أضعف فجوة أولًا: '+gaps[0].missing,
      'اجمع دليل للنقطة الثانية: '+gaps[1].missing,
      'راجع النقطة الثالثة قبل أي التزام أكبر: '+gaps[2].missing,
      'نفّذ أصغر تجربة مناسبة: '+experiment.test,
      'سجّل النتيجة كما حدثت، وقارنها بمعيار النجاح: '+experiment.success,
      'اتخذ الخطوة التالية على أساس النتيجة: استمر لو المعيار تحقق، وإلا عدّل أو توقف. راجع القرار: '+experiment.review
    ];
  }

  function analyze(input){
    const stage=input.stage||'running',type=DECISIONS[input.decisionType]?input.decisionType:'general_decision';
    const questions=input.questions||[],answers=input.answers||{};
    const sums={customer:0,demand:0,economics:0,execution:0,decision:0},counts={customer:0,demand:0,economics:0,execution:0,decision:0};
    let evidenceSum=0,evidenceWeights=0;
    questions.forEach(q=>{
      const value=clamp(Number(answers[q.id]??0),0,3);
      if(q.axis){sums[q.axis]+=value;counts[q.axis]++;}
      const weight=Number(q.evidenceWeight||0);
      if(weight){evidenceSum+=value*weight;evidenceWeights+=weight;}
    });
    const axisScores={};
    Object.keys(AXES).forEach(axis=>axisScores[axis]=Math.round((sums[axis]/Math.max(1,counts[axis]))/3*100));
    const readiness=Math.round(Object.values(axisScores).reduce((a,b)=>a+b,0)/5);
    const evidence=Math.round((evidenceSum/Math.max(1,evidenceWeights))/3*100);
    const riskScore=clamp(Math.round(100-(readiness*.55+evidence*.45)+(DECISIONS[type].riskBias||0)),0,100);
    const readinessBand=band(readiness,[40,70],['منخفض','قيد البناء','أقرب لقرار قابل للدفاع']);
    const evidenceBand=band(evidence,[40,70],['ضعيف','متوسط','قوي']);
    const riskBand=band(riskScore,[36,66],['منخفضة','متوسطة','مرتفعة']);
    let traffic={key:'green',icon:'🟢',title:'المخاطرة منخفضة — جرّب خطوة صغيرة'};
    if(riskBand==='مرتفعة')traffic={key:'red',icon:'🔴',title:'محتاج تتأكد أكتر — ما تصرفش فلوس كبيرة دلوقتي'};
    else if(riskBand==='متوسطة')traffic={key:'orange',icon:'🟠',title:'محتاج تقلّل الحاجات المجهولة قبل ما تلتزم'};
    else if(readiness<70||evidence<70)traffic={key:'yellow',icon:'🟡',title:'المخاطرة منخفضة، لكن محتاج دليل أوضح'};
    const gaps=Object.keys(axisScores).sort((a,b)=>axisScores[a]-axisScores[b]).slice(0,3).map(axis=>({axis,label:AXES[axis],score:axisScores[axis],why:GAP_INFO[axis].why,missing:GAP_INFO[axis].missing}));
    const problem=String(input.problem||input.quickChoice||'القرار الذي تفكر فيه').trim();
    const summary=`اللي كتبته أقرب إلى: ${DECISIONS[type].label}. وبما إنك في مرحلة ${STAGES[stage]}، فأول حاجة محتاجة تتأكد منها هي: ${gaps[0].label}`;
    const plan=personalizedPlan(type,gaps,stage);
    return {stage,type,decision:DECISIONS[type],problem,axisScores,readiness,evidence,riskScore,readinessBand,evidenceBand,riskBand,traffic,gaps,summary,plan,experiment:EXPERIMENTS[type],extraNote:String(input.extraNote||'').trim(),nextDecision:String(input.nextDecision||'').trim()};
  }
  function safeEventData(result){return {stage:result.stage,decision_type:result.type,score_band:result.readinessBand,evidence_band:result.evidenceBand,risk_band:result.riskBand};}
  return {AXES,STAGES,SCALE,QUICK_MAP,DECISIONS,classifyProblem,coreQuestions,adaptiveQuestions,weakAxisFromCore,analyze,safeEventData};
});
